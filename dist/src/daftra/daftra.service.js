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
exports.DaftraService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const settings_service_1 = require("../settings/settings.service");
let DaftraService = class DaftraService {
    prisma;
    settingsService;
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
    }
    async getDaftraConfig() {
        let settings = {};
        try {
            settings = await this.settingsService.getSettings();
        }
        catch (err) {
            console.warn('System settings not loaded - skipping DB fetch');
        }
        const domain = settings['DAFTRA_DOMAIN'] || 'example';
        const apiKey = settings['DAFTRA_API_KEY'] || process.env.DAFTRA_API_KEY || '';
        const baseUrl = `https://${domain}.daftra.com/v2/api`;
        return { baseUrl, apiKey, domain };
    }
    async getDaftraCostCenters() {
        const { baseUrl, apiKey } = await this.getDaftraConfig();
        try {
            const resp = await fetch(`${baseUrl}/entity/cost_center/list?limit=500`, {
                headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
            });
            const data = await resp.json().catch(() => ({}));
            return data?.data || [];
        }
        catch {
            return [];
        }
    }
    async getPmsProjects() {
        return this.prisma.project.findMany({
            select: { id: true, name: true, code: true, status: true, daftraCostCenterId: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async linkProject(id, daftraCostCenterId) {
        return this.prisma.project.update({
            where: { id },
            data: { daftraCostCenterId: daftraCostCenterId === '' ? null : daftraCostCenterId }
        });
    }
    async createAndLinkCostCenter(projectId) {
        const { baseUrl, apiKey, domain } = await this.getDaftraConfig();
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project)
            throw new common_1.BadRequestException('المشروع غير موجود');
        if (project.daftraCostCenterId)
            throw new common_1.BadRequestException('هذا المشروع مربوط بالفعل بمركز تكاليف في دفترة');
        const payload = {
            CostCenter: {
                name: project.name,
                code: project.code || project.name.replace(/\s+/g, '-'),
                is_active: 1,
            }
        };
        const resp = await fetch(`https://${domain}.daftra.com/api2/cost_centers`, {
            method: 'POST',
            headers: { 'APIKEY': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) {
            const err = await resp.text().catch(() => '');
            throw new common_1.BadRequestException(`فشل إنشاء مركز التكاليف في دفترة: ${resp.status} - ${err}`);
        }
        const result = await resp.json();
        const daftraId = result?.id?.toString();
        if (!daftraId)
            throw new common_1.BadRequestException('لم يُعِد دفترة معرّف مركز التكاليف');
        await this.prisma.project.update({
            where: { id: projectId },
            data: { daftraCostCenterId: daftraId }
        });
        return { status: 'created', daftraId, projectName: project.name };
    }
    async syncCostCenters() {
        const { baseUrl, apiKey, domain } = await this.getDaftraConfig();
        if (!apiKey || domain === 'example' || !domain) {
            throw new common_1.BadRequestException('إعدادات الربط غير مكتملة. يرجى إدخال الدومين ومفتاح API.');
        }
        try {
            const response = await fetch(`${baseUrl}/entity/client/list?limit=1`, {
                headers: {
                    'APIKEY': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'No response body');
                throw new common_1.BadRequestException(`مفتاح غير صالح أو حساب منتهي الصلاحية. سيرفر دفترة قال: ${response.status} ${response.statusText} - ${errorText}`);
            }
            return { status: 'success', synced: 0, message: 'تم التحقق من الاتصال بنجاح.' };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('فشل الاتصال: ' + err.message);
        }
    }
    async getDaftraClients() {
        const { baseUrl, apiKey } = await this.getDaftraConfig();
        try {
            let allClients = [];
            let page = 1;
            let hasMore = true;
            const seenIds = new Set();
            while (hasMore && page <= 50) {
                const resp = await fetch(`${baseUrl}/entity/client/list?page=${page}&limit=500`, {
                    headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
                });
                const data = await resp.json().catch(() => ({}));
                const items = data?.data || [];
                if (items.length > 0) {
                    let addedNew = false;
                    for (const item of items) {
                        if (!seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            allClients.push(item);
                            addedNew = true;
                        }
                    }
                    if (!addedNew) {
                        hasMore = false;
                    }
                    else {
                        page++;
                    }
                }
                else {
                    hasMore = false;
                }
            }
            return allClients;
        }
        catch (err) {
            return [];
        }
    }
    async getDaftraSuppliers() {
        const { baseUrl, apiKey } = await this.getDaftraConfig();
        try {
            let allSuppliers = [];
            let page = 1;
            let hasMore = true;
            const seenIds = new Set();
            while (hasMore && page <= 50) {
                const resp = await fetch(`${baseUrl}/entity/supplier/list?page=${page}&limit=500`, {
                    headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
                });
                const data = await resp.json().catch(() => ({}));
                const items = data?.data || [];
                if (items.length > 0) {
                    let addedNew = false;
                    for (const item of items) {
                        if (!seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            allSuppliers.push(item);
                            addedNew = true;
                        }
                    }
                    if (!addedNew) {
                        hasMore = false;
                    }
                    else {
                        page++;
                    }
                }
                else {
                    hasMore = false;
                }
            }
            return allSuppliers;
        }
        catch (err) {
            return [];
        }
    }
    async getPmsSuppliers() {
        return this.prisma.supplier.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    async linkSupplier(id, daftraSupplierId) {
        return this.prisma.supplier.update({
            where: { id },
            data: { daftraSupplierId: daftraSupplierId === "" ? null : daftraSupplierId }
        });
    }
    async getPmsClients() {
        return this.prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    async linkClient(id, daftraClientId) {
        return this.prisma.client.update({
            where: { id },
            data: { daftraClientId: daftraClientId === "" ? null : daftraClientId }
        });
    }
    async pushInvoice(invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                contract: { include: { subcontractor: true, project: { include: { client: true } } } },
                details: { include: { boqItem: true } }
            }
        });
        if (!invoice || invoice.status !== 'CERTIFIED') {
            throw new common_1.BadRequestException('Only certified invoices can be pushed to Daftra');
        }
        const isMainContract = invoice.contract.type === 'MAIN_CONTRACT';
        const totalDeductions = invoice.retentionAmount + invoice.advanceDeduction + invoice.delayPenalty + invoice.otherDeductions;
        const { baseUrl, apiKey, domain } = await this.getDaftraConfig();
        const items = invoice.details.map((detail, index) => ({
            item: detail.boqItem.itemCode || detail.boqItem.description || `بند ${index + 1}`,
            description: detail.boqItem.description || "",
            unit_price: Number(detail.unitPrice),
            quantity: Number(detail.currentQty),
            tax1: 1,
        }));
        if (totalDeductions > 0 && !invoice.deferDeductions) {
            const deductionTax = invoice.deductionTiming === 'BEFORE_VAT' ? 1 : 0;
            items.push({
                item: 'DEDUCTIONS',
                description: `استقطاعات: ضمان حسن تنفيذ ${invoice.retentionAmount} ريال${invoice.advanceDeduction > 0 ? ` | دفعة مقدمة ${invoice.advanceDeduction}` : ''}${invoice.delayPenalty > 0 ? ` | غرامة تأخير ${invoice.delayPenalty}` : ''}${invoice.otherDeductions > 0 ? ` | أخرى ${invoice.otherDeductions}` : ''}`,
                unit_price: -Number(totalDeductions),
                quantity: 1,
                tax1: deductionTax,
            });
        }
        let daftraPayload = {};
        let apiUrl = '';
        if (isMainContract) {
            const client = invoice.contract.project?.client;
            if (!client?.daftraClientId) {
                throw new common_1.BadRequestException(`لا يمكن ترحيل المستخلص. العميل/الجهة المالكة "${client?.name || ''}" غير مربوط بدفترة.`);
            }
            daftraPayload = {
                Invoice: {
                    staff_id: 1,
                    client_id: Number(client.daftraClientId),
                    date: new Date().toISOString().split('T')[0],
                    draft: 1,
                    status: 4,
                    notes: `مستخلص مبيعات رقم: ${invoice.invoiceNumber} | مشروع: ${invoice.contract.project?.name}${invoice.deferDeductions ? ' | الاستقطاعات مؤجلة للمستخلص القادم' : ''}`,
                },
                InvoiceItem: items,
            };
            if (invoice.contract.project?.daftraCostCenterId) {
                daftraPayload.CostCenter = [
                    { cost_center_id: Number(invoice.contract.project.daftraCostCenterId), percentage: 100 }
                ];
            }
            apiUrl = `https://${domain}.daftra.com/api2/invoices`;
        }
        else {
            const supplier = invoice.contract.subcontractor;
            if (!supplier?.daftraSupplierId) {
                throw new common_1.BadRequestException(`لا يمكن ترحيل المستخلص. المقاول/المورد "${supplier?.name || ''}" غير مربوط بدفترة.`);
            }
            daftraPayload = {
                PurchaseOrder: {
                    staff_id: 1,
                    supplier_id: Number(supplier.daftraSupplierId),
                    date: new Date().toISOString().split('T')[0],
                    draft: 1,
                    status: 4,
                    notes: `مستخلص مورد/مقاول باطن رقم: ${invoice.invoiceNumber} | مشروع: ${invoice.contract.project?.name}${invoice.deferDeductions ? ' | الاستقطاعات مؤجلة للمستخلص القادم' : ''}`,
                },
                PurchaseOrderItem: items,
            };
            if (invoice.contract.project?.daftraCostCenterId) {
                daftraPayload.CostCenter = [
                    { cost_center_id: Number(invoice.contract.project.daftraCostCenterId), percentage: 100 }
                ];
            }
            apiUrl = `https://${domain}.daftra.com/api2/purchase_invoices`;
        }
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'APIKEY': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(daftraPayload)
            });
            const rawText = await response.text();
            let responseData = {};
            try {
                responseData = JSON.parse(rawText);
            }
            catch (e) { }
            if (!response.ok || responseData.code === 400 || responseData.error) {
                throw new Error(`دفترة رفض الطلب: ${rawText}`);
            }
            const invoiceDaftraId = responseData.id ||
                responseData.Invoice?.id ||
                responseData.PurchaseInvoice?.id ||
                responseData.data?.id ||
                responseData.result?.id ||
                responseData.invoice_id;
            if (!invoiceDaftraId) {
                throw new Error(`دفترة قَبِل الطلب لكنه لم يعط رقم فاتورة! الرد الكامل: ${rawText}`);
            }
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: { daftraInvoiceId: invoiceDaftraId.toString() }
            });
            return { status: 'Invoice pushed successfully', externalId: invoiceDaftraId };
        }
        catch (error) {
            throw new common_1.BadRequestException(`فشل ترحيل المستخلص إلى دفترة: ${error.message}`);
        }
    }
    async testPo() {
        try {
            const { baseUrl, apiKey } = await this.getDaftraConfig();
            const res = await fetch(`${baseUrl}/entity/purchase_order/list?limit=1`, {
                method: 'GET',
                headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
            });
            const text = await res.text();
            try {
                return JSON.parse(text);
            }
            catch (e) {
                return { rawText: text, error: 'Failed to parse JSON' };
            }
        }
        catch (err) {
            return { error: err.message };
        }
    }
    async pushPurchaseOrder(poId) {
        const po = await this.prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: { project: true, supplier: true, items: { include: { material: true } } }
        });
        if (!po)
            throw new common_1.BadRequestException('طلب الشراء غير موجود');
        const { baseUrl, apiKey, domain } = await this.getDaftraConfig();
        if (!po.supplier?.daftraSupplierId) {
            throw new common_1.BadRequestException(`المورد "${po.supplier?.name}" غير مربوط بدفترة! يرجى الذهاب لصفحة "إعدادات دفترة" وربط هذا المورد قبل تصدير أمر الشراء.`);
        }
        const payloadPurchaseOrder = {
            staff_id: 1,
            supplier_id: Number(po.supplier.daftraSupplierId),
            date: new Date().toISOString().split('T')[0],
            notes: `PO from PMS | Project: ${po.project?.name || 'N/A'} | Supplier: ${po.supplier?.name || 'N/A'}`,
        };
        const daftraPayload = {
            PurchaseOrder: {
                ...payloadPurchaseOrder,
                draft: 1,
                status: 4
            },
            Supplier: {
                id: Number(po.supplier.daftraSupplierId),
                email: (po.supplier.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(po.supplier.email)) ? po.supplier.email : `vendor${po.supplier.daftraSupplierId}@example.com`
            },
            PurchaseOrderItem: po.items.map((item, index) => ({
                item: item.material.name || `مادة ${index + 1}`,
                description: item.material.name || "",
                quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
                unit_price: typeof item.unitPrice === 'number' && item.unitPrice >= 0 ? item.unitPrice : 0,
                tax1: po.taxAmount > 0 ? 1 : 0
            }))
        };
        if (po.project?.daftraCostCenterId) {
            daftraPayload.CostCenter = [
                { cost_center_id: Number(po.project.daftraCostCenterId), percentage: 100 }
            ];
        }
        try {
            const response = await fetch(`https://${domain}.daftra.com/api2/purchase_orders`, {
                method: 'POST',
                headers: { 'APIKEY': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(daftraPayload)
            });
            const rawText = await response.text();
            let resData = {};
            try {
                resData = JSON.parse(rawText);
            }
            catch (e) { }
            if (!response.ok || resData.code === 400 || resData.error) {
                throw new common_1.BadRequestException(`سيرفر دفترة يرفض أمر الشراء. الرد: ${rawText}`);
            }
            const daftraId = resData?.id?.toString() || resData?.PurchaseOrder?.id?.toString() || `SYNCED-${Date.now()}`;
            return { status: 'success', daftraId };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('فشل تقني في رفع أمر الشراء: ' + err.message);
        }
    }
    async pushExpense(expenseId) {
        const expense = await this.prisma.expense.findUnique({
            where: { id: expenseId },
            include: { project: true }
        });
        if (!expense)
            throw new common_1.BadRequestException('المصروف غير موجود');
        const { apiKey, domain } = await this.getDaftraConfig();
        const daftraPayload = {
            Expense: {
                staff_id: 1,
                amount: expense.amount,
                date: new Date(expense.date).toISOString().split('T')[0],
                notes: `${expense.category} | ${expense.expenseNo} | ${expense.description} | Pushed from PMS`,
            }
        };
        if (expense.project?.daftraCostCenterId) {
            daftraPayload.CostCenter = [
                { cost_center_id: Number(expense.project.daftraCostCenterId), percentage: 100 }
            ];
        }
        try {
            const response = await fetch(`https://${domain}.daftra.com/api2/expenses`, {
                method: 'POST',
                headers: { 'APIKEY': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(daftraPayload)
            });
            const rawText = await response.text();
            let resData = {};
            try {
                resData = JSON.parse(rawText);
            }
            catch (e) { }
            if (!response.ok || resData.code === 400 || resData.error) {
                throw new common_1.BadRequestException(`فشل ترحيل المصروف لدفترة. الرد: ${rawText}`);
            }
            const daftraId = resData?.id?.toString() || resData?.Expense?.id?.toString();
            return { status: 'success', daftraId };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException('فشل تقني في ترحيل المصروف: ' + err.message);
        }
    }
    async syncInvoicePaymentStatus(invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { contract: true }
        });
        if (!invoice || !invoice.daftraInvoiceId) {
            throw new common_1.BadRequestException('المستخلص غير مربوط بدفترة!');
        }
        const { apiKey, domain } = await this.getDaftraConfig();
        const isMainContract = invoice.contract.type === 'MAIN_CONTRACT';
        const endpoint = isMainContract ? 'invoices' : 'purchase_invoices';
        try {
            const response = await fetch(`https://${domain}.daftra.com/api2/${endpoint}/${invoice.daftraInvoiceId}`, {
                method: 'GET',
                headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    await this.prisma.invoice.update({
                        where: { id: invoiceId },
                        data: {
                            status: 'DRAFT',
                            daftraInvoiceId: null,
                            paymentStatus: 'UNPAID',
                            paidAmount: 0,
                        }
                    });
                    throw new common_1.BadRequestException('تنبيه: لم يتم العثور على المستند في دفترة (قد يكون محذوفاً). ' +
                        'تم إعادة المستخلص تلقائياً إلى حالة المسودة حتى تتمكن من إعادة الترحيل.');
                }
                throw new Error(`فشل الاتصال: ${response.status}`);
            }
            const resData = await response.json();
            const nodeName = isMainContract ? 'Invoice' : 'PurchaseInvoice';
            const daftraDoc = resData.data?.[nodeName] || resData[nodeName] || resData.data?.PurchaseOrder || resData.data || {};
            let payStatus = "UNPAID";
            let paidAmt = 0;
            const totalAmount = Number(daftraDoc.summary_total ?? daftraDoc.total ?? daftraDoc.total_amount ?? invoice.netAmount);
            const dueAmount = Number(daftraDoc.summary_unpaid ?? daftraDoc.due_amount ?? daftraDoc.unpaid ?? totalAmount);
            const daftraStatus = daftraDoc.payment_status || daftraDoc.status;
            if (daftraStatus === 3 || daftraStatus === 2 || daftraStatus === "Paid" || daftraStatus === "مدفوع") {
                payStatus = "PAID";
                paidAmt = totalAmount;
            }
            else if (totalAmount > 0) {
                if (dueAmount <= 0) {
                    payStatus = "PAID";
                    paidAmt = totalAmount;
                }
                else if (dueAmount < totalAmount) {
                    payStatus = "PARTIAL";
                    paidAmt = totalAmount - dueAmount;
                }
            }
            await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: { paymentStatus: payStatus, paidAmount: paidAmt }
            });
            return { paymentStatus: payStatus, paidAmount: paidAmt, daftraRaw: resData };
        }
        catch (err) {
            throw new common_1.BadRequestException(`فشل استرداد حالة السداد من دفترة: ${err.message}`);
        }
    }
    async syncPurchaseOrderStatus(poId, daftraId) {
        const { apiKey, domain } = await this.getDaftraConfig();
        try {
            const response = await fetch(`https://${domain}.daftra.com/api2/purchase_orders/${daftraId}`, {
                method: 'GET',
                headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    await this.prisma.purchaseOrder.update({
                        where: { id: poId },
                        data: { status: 'PENDING', daftraId: null }
                    });
                    throw new common_1.BadRequestException('تنبيه: لم يتم العثور على أمر الشراء في دفترة (قد يكون محذوفاً). ' +
                        'تم إعادته تلقائياً إلى حالة المسودة حتى تتمكن من إعادة الترحيل.');
                }
                throw new Error(`فشل الاتصال بدفترة: ${response.status}`);
            }
            const resData = await response.json();
            const poData = resData.data?.PurchaseOrder || resData.PurchaseOrder || resData.data || {};
            return { status: 'synced', daftraData: poData };
        }
        catch (err) {
            throw new common_1.BadRequestException(`فشل مزامنة أمر الشراء من دفترة: ${err.message}`);
        }
    }
};
exports.DaftraService = DaftraService;
exports.DaftraService = DaftraService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, settings_service_1.SettingsService])
], DaftraService);
//# sourceMappingURL=daftra.service.js.map