import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DaftraService } from '../daftra/daftra.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService, private daftraService: DaftraService) {}

  /**
   * Generates a monthly Mustaqlasa (progress invoice)
   * The actual executed quantities must be passed as an array: { boqItemId, currentQty }
   */
  async generateMustaqlasa(contractId: string, payload: any) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // payload structure: { executionData: [{boqItemId, currentQty}], taxPercent, advanceDeduction, delayPenalty, otherDeductions }
        const { executionData, taxPercent = 0, advanceDeduction = 0, delayPenalty = 0, otherDeductions = 0, deductionTiming = 'AFTER_VAT', deferDeductions = false } = payload;

        const contract = await tx.contract.findUnique({
          where: { id: contractId },
          include: { project: true, items: true }
        });
        if (!contract) throw new BadRequestException('Contract not found');

        // 1. Pre-fetch BOQ Items in a single query
        const boqItemIds = executionData.map((item: any) => item.boqItemId);
        const boqItems = await tx.bOQItem.findMany({
          where: { id: { in: boqItemIds } }
        });

        // 2. Pre-fetch previous invoice details in a single query
        const previousDetails = await tx.invoiceDetail.findMany({
          where: {
            invoice: {
              contractId: contractId,
            },
            boqItemId: { in: boqItemIds }
          }
        });

        let grossAmount = 0;
        const detailsToCreate = [];

        for (const item of executionData) {
          const boqItem = boqItems.find(b => b.id === item.boqItemId);
          if (!boqItem) throw new BadRequestException(`BOQ Item ${item.boqItemId} not found`);

          let invoiceUnitPrice = boqItem.unitPrice;
          let invoiceMaxQuantity = boqItem.quantity;

          // If it's a subcontract, use the exact assigned prices and quantities!
          if (contract.type === 'SUBCONTRACT' && contract.items && contract.items.length > 0) {
             const cItem = contract.items.find(ci => ci.boqItemId === boqItem.id);
             if (!cItem) throw new BadRequestException(`BOQ Item ${item.boqItemId} is not assigned to this contract`);
             invoiceUnitPrice = cItem.unitPrice;
             invoiceMaxQuantity = cItem.assignedQty; // Subcontractor cannot exceed their assigned qty
          }

          // Filter previous details in memory
          const itemPrevDetails = previousDetails.filter(d => d.boqItemId === boqItem.id);
          const previousQty = itemPrevDetails.reduce((sum, d) => sum + d.currentQty, 0);
          const currentQty = parseFloat(item.currentQty);
          const totalQty = previousQty + currentQty;

          if (totalQty > invoiceMaxQuantity) {
            throw new BadRequestException(`Executed quantity exceeds planned for BOQ item ${boqItem.itemCode || boqItem.description}`);
          }

          const currentValue = currentQty * invoiceUnitPrice;
          grossAmount += currentValue;

          detailsToCreate.push({
            boqItem: { connect: { id: boqItem.id } },
            previousQty,
            currentQty,
            totalQty,
            unitPrice: invoiceUnitPrice,
            currentValue
          });

          if (contract.type === 'MAIN_CONTRACT') {
            await tx.bOQItem.update({
              where: { id: boqItem.id },
              data: { executedQty: totalQty }
            });
          }
        }

        // Deductions
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
            createdBy: payload.createdBy,
            details: {
              create: detailsToCreate
            }
          },
          include: { details: true, contract: true }
        });

        return invoice;
      }, {
        maxWait: 10000,
        timeout: 45000
      });
    } catch (error: any) {
      console.error("Error in generateMustaqlasa:", error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`DEBUG_500: ${error.message} \nStack: ${error.stack}`);
    }
  }

  async syncPaymentStatus(invoiceId: string) {
    return this.daftraService.syncInvoicePaymentStatus(invoiceId);
  }

  async certifyInvoice(invoiceId: string, userName: string) {
    // 1. Initial Local Update
    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { 
        status: 'CERTIFIED',
        approvedBy: userName,
        approvedAt: new Date()
      }
    });

    return updated;
  }

  async findAllByContract(contractId: string) {
    return this.prisma.invoice.findMany({
      where: { contractId },
      include: { details: { include: { boqItem: true } }, project: true, contract: { include: { subcontractor: true } } },
      orderBy: { issueDate: 'desc' }
    });
  }

  async findOne(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { 
        details: { include: { boqItem: true } }, 
        project: { include: { client: true } }, 
        contract: { 
          include: { 
            subcontractor: true, 
            items: { include: { boqItem: true } },
            invoices: { include: { details: true } }
          } 
        } 
      }
    });
  }

  async deleteMustaqlasa(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: { details: true, contract: true }
      });
      if (!invoice) throw new BadRequestException('المستخلص غير موجود');
      if (invoice.status !== 'DRAFT') throw new BadRequestException('لا يمكن حذف مستخلص معتمد أو مدفوع.');

      // Revert BOQ Items Execution Qty (only for MAIN_CONTRACT)
      if (invoice.contract.type === 'MAIN_CONTRACT') {
        for (const detail of invoice.details) {
          if (detail.currentQty && detail.currentQty > 0) {
            await tx.bOQItem.update({
              where: { id: detail.boqItemId },
              data: { executedQty: { decrement: detail.currentQty } }
            });
          }
        }
      }

      await tx.invoiceDetail.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.delete({ where: { id } });
    }, {
      maxWait: 10000,
      timeout: 45000
    });
  }

  async updateMustaqlasa(id: string, payload: any) {
    return this.prisma.$transaction(async (tx) => {
      const existingInvoice = await tx.invoice.findUnique({
        where: { id },
        include: { details: true, contract: { include: { items: true } } }
      });

      if (!existingInvoice) throw new BadRequestException('Invoice not found');
      if (existingInvoice.status !== 'DRAFT') throw new BadRequestException('Cannot edit a certified or paid invoice');

      const { executionData, taxPercent = 0, advanceDeduction = 0, delayPenalty = 0, otherDeductions = 0, deductionTiming = 'AFTER_VAT', deferDeductions = false } = payload;
      const contract = existingInvoice.contract;

      // 1. Revert existing execution quantities in BOQ items (only for MAIN_CONTRACT)
      if (contract.type === 'MAIN_CONTRACT') {
        for (const detail of existingInvoice.details) {
          await tx.bOQItem.update({
            where: { id: detail.boqItemId },
            data: { executedQty: { decrement: detail.currentQty } } // revert only the 'currentQty' from this draft
          });
        }
      }

      // 2. Delete existing details
      await tx.invoiceDetail.deleteMany({
        where: { invoiceId: id }
      });

      // 3. Pre-fetch BOQ Items in a single query
      const boqItemIds = executionData.map((item: any) => item.boqItemId);
      const boqItems = await tx.bOQItem.findMany({
        where: { id: { in: boqItemIds } }
      });

      // 4. Pre-fetch previous invoice details (excluding the current invoice)
      const previousDetails = await tx.invoiceDetail.findMany({
        where: {
          invoice: {
            contractId: contract.id,
            id: { not: id }
          },
          boqItemId: { in: boqItemIds }
        }
      });

      // 5. Process new execution data
      let grossAmount = 0;
      const detailsToCreate = [];

      for (const item of executionData) {
        if (!item.currentQty || item.currentQty <= 0) continue;

        const boqItem = boqItems.find(b => b.id === item.boqItemId);
        if (!boqItem) throw new BadRequestException(`BOQ Item ${item.boqItemId} not found`);

        let invoiceUnitPrice = boqItem.unitPrice;
        let invoiceMaxQuantity = boqItem.quantity;

        // If it's a subcontract, use the exact assigned prices and quantities!
        if (contract.type === 'SUBCONTRACT' && contract.items && contract.items.length > 0) {
           const cItem = contract.items.find(ci => ci.boqItemId === boqItem.id);
           if (!cItem) throw new BadRequestException(`BOQ Item ${item.boqItemId} is not assigned to this contract`);
           invoiceUnitPrice = cItem.unitPrice;
           invoiceMaxQuantity = cItem.assignedQty;
        }

        // Filter previous details in memory
        const itemPrevDetails = previousDetails.filter(d => d.boqItemId === boqItem.id);
        const previousQty = itemPrevDetails.reduce((sum, d) => sum + d.currentQty, 0);
        const currentQty = parseFloat(item.currentQty);
        const totalQty = previousQty + currentQty;

        if (totalQty > invoiceMaxQuantity) {
          throw new BadRequestException(`Executed quantity exceeds planned for BOQ item ${boqItem.itemCode || boqItem.description}`);
        }

        const currentValue = currentQty * invoiceUnitPrice;
        grossAmount += currentValue;

        detailsToCreate.push({
          boqItem: { connect: { id: boqItem.id } },
          previousQty,
          currentQty,
          totalQty,
          unitPrice: invoiceUnitPrice,
          currentValue
        });

        if (contract.type === 'MAIN_CONTRACT') {
          await tx.bOQItem.update({
            where: { id: boqItem.id },
            data: { executedQty: totalQty }
          });
        }
      }

      // 6. Recalculate Financials
      const retentionAmount = grossAmount * (contract.retentionPercent / 100.0);
      const totalDeductions = retentionAmount + Number(advanceDeduction) + Number(delayPenalty) + Number(otherDeductions);
      const taxableAmount = grossAmount - retentionAmount - Number(advanceDeduction) - Number(delayPenalty) - Number(otherDeductions);
      const taxAmount = Math.max(0, taxableAmount * (Number(taxPercent) / 100.0));
      const netAmount = grossAmount - totalDeductions + taxAmount;

      // 7. Update Invoice
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
    }, {
      maxWait: 10000,
      timeout: 45000
    });
  }
}
