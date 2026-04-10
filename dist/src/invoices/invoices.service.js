"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const daftra_service_1 = require("../daftra/daftra.service");
let InvoicesService = class InvoicesService {
    prisma;
    daftraService;
    constructor(prisma, daftraService) {
        this.prisma = prisma;
        this.daftraService = daftraService;
    }
    async generateMustaqlasa(contractId, payload) {
        return this.prisma.$transaction(async (tx) => {
            const { executionData, taxPercent = 0, advanceDeduction = 0, delayPenalty = 0, otherDeductions = 0, deductionTiming = 'AFTER_VAT', deferDeductions = false } = payload;
            const contract = await tx.contract.findUnique({
                where: { id: contractId },
                include: { project: true }
            });
            if (!contract)
                throw new common_1.BadRequestException('Contract not found');
            let grossAmount = 0;
            const detailsToCreate = [];
            for (const item of executionData) {
                const boqItem = await tx.bOQItem.findUnique({
                    where: { id: item.boqItemId }
                });
                if (!boqItem)
                    throw new common_1.BadRequestException(`BOQ Item ${item.boqItemId} not found`);
                const previousQty = boqItem.executedQty;
                const currentQty = parseFloat(item.currentQty);
                const totalQty = previousQty + currentQty;
                if (totalQty > boqItem.quantity) {
                    throw new common_1.BadRequestException(`Executed quantity exceeds planned for BOQ item ${boqItem.itemCode || boqItem.description}`);
                }
                const currentValue = currentQty * boqItem.unitPrice;
                grossAmount += currentValue;
                detailsToCreate.push({
                    boqItem: { connect: { id: boqItem.id } },
                    previousQty,
                    currentQty,
                    totalQty,
                    unitPrice: boqItem.unitPrice,
                    currentValue
                });
                await tx.bOQItem.update({
                    where: { id: boqItem.id },
                    data: { executedQty: totalQty }
                });
            }
            const retentionAmount = grossAmount * (contract.retentionPercent / 100.0);
            const totalDeductions = retentionAmount + Number(advanceDeduction) + Number(delayPenalty) + Number(otherDeductions);
            const taxableAmount = grossAmount - retentionAmount - Number(advanceDeduction) - Number(delayPenalty) - Number(otherDeductions);
            const taxAmount = Math.max(0, taxableAmount * (Number(taxPercent) / 100.0));
            const netAmount = grossAmount - totalDeductions + taxAmount;
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    issueDate: new Date(),
                    project: { connect: { id: contract.projectId } },
                    contract: { connect: { id: contractId } },
                    grossAmount,
                    taxPercent: Number(taxPercent),
                    taxAmount,
                    retentionPercent: contract.retentionPercent,
                    retentionAmount,
                    advanceDeduction: Number(advanceDeduction),
                    delayPenalty: Number(delayPenalty),
                    otherDeductions: Number(otherDeductions),
                    deductionTiming,
                    deferDeductions,
                    netAmount,
                    status: 'DRAFT',
                    details: {
                        create: detailsToCreate
                    }
                },
                include: { details: true, contract: true }
            });
            return invoice;
        });
    }
    async syncPaymentStatus(invoiceId) {
        return this.daftraService.syncInvoicePaymentStatus(invoiceId);
    }
    async certifyInvoice(invoiceId) {
        const updated = await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: 'CERTIFIED' }
        });
        try {
            await this.daftraService.pushInvoice(invoiceId);
        }
        catch (err) {
            await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'DRAFT' }
            });
            throw new common_1.BadRequestException(err.message);
        }
        const finalUpdate = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
        return { ...finalUpdate, daftraExternalId: finalUpdate?.daftraInvoiceId };
    }
    async findAllByContract(contractId) {
        return this.prisma.invoice.findMany({
            where: { contractId },
            include: { details: { include: { boqItem: true } }, project: true, contract: { include: { subcontractor: true } } },
            orderBy: { issueDate: 'desc' }
        });
    }
    async findOne(id) {
        return this.prisma.invoice.findUnique({
            where: { id },
            include: {
                details: { include: { boqItem: true } },
                project: { include: { client: true } },
                contract: { include: { subcontractor: true } }
            }
        });
    }
    async deleteMustaqlasa(id) {
        return this.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id },
                include: { details: true, contract: true }
            });
            if (!invoice)
                throw new common_1.BadRequestException('المستخلص غير موجود');
            if (invoice.status !== 'DRAFT')
                throw new common_1.BadRequestException('لا يمكن حذف مستخلص معتمد أو مدفوع.');
            for (const detail of invoice.details) {
                if (detail.currentQty && detail.currentQty > 0) {
                    await tx.bOQItem.update({
                        where: { id: detail.boqItemId },
                        data: { executedQty: { decrement: detail.currentQty } }
                    });
                }
            }
            await tx.invoiceDetail.deleteMany({ where: { invoiceId: id } });
            return tx.invoice.delete({ where: { id } });
        });
    }
    async updateMustaqlasa(id, payload) {
        return this.prisma.$transaction(async (tx) => {
            const existingInvoice = await tx.invoice.findUnique({
                where: { id },
                include: { details: true, contract: true }
            });
            if (!existingInvoice)
                throw new common_1.BadRequestException('Invoice not found');
            if (existingInvoice.status !== 'DRAFT')
                throw new common_1.BadRequestException('Cannot edit a certified or paid invoice');
            const { executionData, taxPercent = 0, advanceDeduction = 0, delayPenalty = 0, otherDeductions = 0, deductionTiming = 'AFTER_VAT', deferDeductions = false } = payload;
            const contract = existingInvoice.contract;
            for (const detail of existingInvoice.details) {
                await tx.bOQItem.update({
                    where: { id: detail.boqItemId },
                    data: { executedQty: { decrement: detail.currentQty } }
                });
            }
            await tx.invoiceDetail.deleteMany({
                where: { invoiceId: id }
            });
            let grossAmount = 0;
            const detailsToCreate = [];
            for (const item of executionData) {
                if (!item.currentQty || item.currentQty <= 0)
                    continue;
                const boqItem = await tx.bOQItem.findUnique({
                    where: { id: item.boqItemId }
                });
                if (!boqItem)
                    throw new common_1.BadRequestException(`BOQ Item ${item.boqItemId} not found`);
                const previousQty = boqItem.executedQty;
                const currentQty = parseFloat(item.currentQty);
                const totalQty = previousQty + currentQty;
                if (totalQty > boqItem.quantity) {
                    throw new common_1.BadRequestException(`Executed quantity exceeds planned for BOQ item ${boqItem.itemCode || boqItem.description}`);
                }
                const currentValue = currentQty * boqItem.unitPrice;
                grossAmount += currentValue;
                detailsToCreate.push({
                    boqItem: { connect: { id: boqItem.id } },
                    previousQty,
                    currentQty,
                    totalQty,
                    unitPrice: boqItem.unitPrice,
                    currentValue
                });
                await tx.bOQItem.update({
                    where: { id: boqItem.id },
                    data: { executedQty: totalQty }
                });
            }
            const retentionAmount = grossAmount * (contract.retentionPercent / 100.0);
            const totalDeductions = retentionAmount + Number(advanceDeduction) + Number(delayPenalty) + Number(otherDeductions);
            const taxableAmount = grossAmount - retentionAmount - Number(advanceDeduction) - Number(delayPenalty) - Number(otherDeductions);
            const taxAmount = Math.max(0, taxableAmount * (Number(taxPercent) / 100.0));
            const netAmount = grossAmount - totalDeductions + taxAmount;
            const updatedInvoice = await tx.invoice.update({
                where: { id },
                data: {
                    grossAmount,
                    taxPercent: Number(taxPercent),
                    taxAmount,
                    retentionAmount,
                    advanceDeduction: Number(advanceDeduction),
                    delayPenalty: Number(delayPenalty),
                    otherDeductions: Number(otherDeductions),
                    deductionTiming,
                    deferDeductions,
                    netAmount,
                    details: {
                        create: detailsToCreate
                    }
                },
                include: { details: true, contract: true }
            });
            return updatedInvoice;
        });
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, daftra_service_1.DaftraService])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map