import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
// v2.1 - supplier_email removed from PurchaseOrder payload

@Injectable()
export class DaftraService {
  constructor(private prisma: PrismaService, private settingsService: SettingsService) {}

  private async getDaftraConfig() {
    let settings: Record<string, string> = {};
    try {
      settings = await this.settingsService.getSettings();
    } catch (err) {
      console.warn('System settings not loaded - skipping DB fetch');
    }
    const domain = settings['DAFTRA_DOMAIN'] || 'example';
    const apiKey = settings['DAFTRA_API_KEY'] || process.env.DAFTRA_API_KEY || '';
    const baseUrl = `https://${domain}.daftra.com/v2/api`;
    return { baseUrl, apiKey, domain };
  }

  // ────────────────────────────────────────────────────────────
  //  COST CENTERS - مراكز التكاليف
  // ────────────────────────────────────────────────────────────

  /** Fetch all cost centers defined in Daftra */
  async getDaftraCostCenters() {
    const { baseUrl, apiKey } = await this.getDaftraConfig();
    try {
      const resp = await fetch(`${baseUrl}/entity/cost_center/list?limit=500`, {
        headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
      });
      const data = await resp.json().catch(() => ({}));
      return data?.data || [];
    } catch {
      return [];
    }
  }

  /** Get all PMS projects with their Daftra cost center linking status */
  async getPmsProjects() {
    return this.prisma.project.findMany({
      select: { id: true, name: true, code: true, status: true, daftraCostCenterId: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /** Link a PMS project to a Daftra cost center */
  async linkProject(id: string, daftraCostCenterId: string | null) {
    return this.prisma.project.update({
      where: { id },
      data: { daftraCostCenterId: daftraCostCenterId === '' ? null : daftraCostCenterId }
    });
  }

  /** Auto-create a cost center in Daftra for a PMS project, then link it */
  async createAndLinkCostCenter(projectId: string) {
    const { baseUrl, apiKey, domain } = await this.getDaftraConfig();

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new BadRequestException('المشروع غير موجود');
    if (project.daftraCostCenterId) throw new BadRequestException('هذا المشروع مربوط بالفعل بمركز تكاليف في دفترة');

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
      throw new BadRequestException(`فشل إنشاء مركز التكاليف في دفترة: ${resp.status} - ${err}`);
    }

    const result = await resp.json();
    const daftraId = result?.id?.toString();
    if (!daftraId) throw new BadRequestException('لم يُعِد دفترة معرّف مركز التكاليف');

    // Link locally
    await this.prisma.project.update({
      where: { id: projectId },
      data: { daftraCostCenterId: daftraId }
    });

    return { status: 'created', daftraId, projectName: project.name };
  }

  async syncCostCenters() {
    const { baseUrl, apiKey, domain } = await this.getDaftraConfig();
    
    if (!apiKey || domain === 'example' || !domain) {
      throw new BadRequestException('إعدادات الربط غير مكتملة. يرجى إدخال الدومين ومفتاح API.');
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
        throw new BadRequestException(`مفتاح غير صالح أو حساب منتهي الصلاحية. سيرفر دفترة قال: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return { status: 'success', synced: 0, message: 'تم التحقق من الاتصال بنجاح.' };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('فشل الاتصال: ' + err.message);
    }
  }

  async getDaftraClients() {
    const { baseUrl, apiKey } = await this.getDaftraConfig();
    try {
      let allClients: any[] = [];
      let page = 1;
      let hasMore = true;
      const seenIds = new Set();

      while (hasMore && page <= 50) { // Increased safety to 50 pages to ensure full DB load
        const resp = await fetch(`${baseUrl}/entity/client/list?page=${page}&limit=500`, {
          headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
        });
        const data = await resp.json().catch(() => ({}));
        const items = data?.data || [];
        
        if (items.length > 0) {
          // Deduplicate items
          let addedNew = false;
          for (const item of items) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allClients.push(item);
              addedNew = true;
            }
          }
          if (!addedNew) {
            hasMore = false; // Stop if page returned nothing new (fallback for bad APIs)
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      return allClients;
    } catch (err) {
      return [];
    }
  }

  async getDaftraSuppliers() {
    const { baseUrl, apiKey } = await this.getDaftraConfig();
    try {
      let allSuppliers: any[] = [];
      let page = 1;
      let hasMore = true;
      const seenIds = new Set();

      while (hasMore && page <= 50) { // Increased safety to 50 pages
        const resp = await fetch(`${baseUrl}/entity/supplier/list?page=${page}&limit=500`, {
          headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
        });
        const data = await resp.json().catch(() => ({}));
        const items = data?.data || [];
        
        if (items.length > 0) {
          // Deduplicate items
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
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      return allSuppliers;
    } catch (err) {
      return [];
    }
  }

  async getPmsSuppliers() {
    return this.prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async linkSupplier(id: string, daftraSupplierId: string | null) {
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

  async linkClient(id: string, daftraClientId: string | null) {
    return this.prisma.client.update({
      where: { id },
      data: { daftraClientId: daftraClientId === "" ? null : daftraClientId }
    });
  }

  async pushInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        contract: { include: { subcontractor: true, project: { include: { client: true } } } },
        details: { include: { boqItem: true } }
      }
    });

    if (!invoice || invoice.status !== 'CERTIFIED') {
      throw new BadRequestException('Only certified invoices can be pushed to Daftra');
    }

    const isMainContract = invoice.contract.type === 'MAIN_CONTRACT';
    const totalDeductions = invoice.retentionAmount + invoice.advanceDeduction + invoice.delayPenalty + invoice.otherDeductions;
    const { baseUrl, apiKey, domain } = await this.getDaftraConfig();

    // Build items array
    const items: any[] = invoice.details.map((detail: any, index: number) => ({
      item: detail.boqItem.itemCode || detail.boqItem.description || `بند ${index + 1}`,
      description: detail.boqItem.description || "",
      unit_price: Number(detail.unitPrice),
      quantity: Number(detail.currentQty),
      tax1: 1, // Defaulting to tax applied
    }));

    // Add deductions
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

    let daftraPayload: any = {};
    let apiUrl = '';

    if (isMainContract) {
      // ────────────────────────────────────────────────────────
      // SALES INVOICE (MAIN_CONTRACT)
      // ────────────────────────────────────────────────────────
      const client = invoice.contract.project?.client;
      if (!client?.daftraClientId) {
        throw new BadRequestException(`لا يمكن ترحيل المستخلص. العميل/الجهة المالكة "${client?.name || ''}" غير مربوط بدفترة.`);
      }

      daftraPayload = {
        Invoice: {
          staff_id: 1,
          client_id: Number(client.daftraClientId),
          date: new Date().toISOString().split('T')[0],
          draft: 1, // 1 = Daftra flag to save as completely DRAFT (Prevents ZATCA reporting)
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

    } else {
      // ────────────────────────────────────────────────────────
      // PURCHASE INVOICE (SUBCONTRACT)
      // ────────────────────────────────────────────────────────
      const supplier = invoice.contract.subcontractor;
      if (!supplier?.daftraSupplierId) {
        throw new BadRequestException(`لا يمكن ترحيل المستخلص. المقاول/المورد "${supplier?.name || ''}" غير مربوط بدفترة.`);
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
      let responseData: any = {};
      try { responseData = JSON.parse(rawText); } catch(e) {}

      if (!response.ok || responseData.code === 400 || responseData.error) {
        throw new Error(`دفترة رفض الطلب: ${rawText}`);
      }

      const invoiceDaftraId = 
        responseData.id || 
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
    } catch (error: any) {
      throw new BadRequestException(`فشل ترحيل المستخلص إلى دفترة: ${error.message}`);
    }
  }

  async testPo() {
    try {
      const { baseUrl, apiKey } = await this.getDaftraConfig();
      // Fetch the first purchase order list from V2 API
      const res = await fetch(`${baseUrl}/entity/purchase_order/list?limit=1`, {
        method: 'GET',
        headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { rawText: text, error: 'Failed to parse JSON' };
      }
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * Push an approved Purchase Order (PO) to Daftra
   */
  async pushPurchaseOrder(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { project: true, supplier: true, items: { include: { material: true } } }
    });

    if (!po) throw new BadRequestException('طلب الشراء غير موجود');
    
    const { baseUrl, apiKey, domain } = await this.getDaftraConfig();

    if (!po.supplier?.daftraSupplierId) {
      throw new BadRequestException(`المورد "${po.supplier?.name}" غير مربوط بدفترة! يرجى الذهاب لصفحة "إعدادات دفترة" وربط هذا المورد قبل تصدير أمر الشراء.`);
    }

    const payloadPurchaseOrder: any = {
      staff_id: 1, // REQUIRED by Daftra
      supplier_id: Number(po.supplier.daftraSupplierId), // Explicitly link the supplier
      date: new Date().toISOString().split('T')[0],
      notes: `PO from PMS | Project: ${po.project?.name || 'N/A'} | Supplier: ${po.supplier?.name || 'N/A'}`,
    };

    const daftraPayload: any = {
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
        item: item.material.name || `مادة ${index + 1}`, // 'item' is required by Daftra V1 API
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
      // Use the stable v1 API endpoint for purchase_order which perfectly matches the nested payload structure
      const response = await fetch(`https://${domain}.daftra.com/api2/purchase_orders`, {
        method: 'POST',
        headers: { 'APIKEY': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(daftraPayload)
      });
      
      const rawText = await response.text();
      let resData: any = {};
      try { resData = JSON.parse(rawText); } catch(e) {}

      if (!response.ok || resData.code === 400 || resData.error) {
         throw new BadRequestException(`سيرفر دفترة يرفض أمر الشراء. الرد: ${rawText}`);
      }

      const daftraId = resData?.id?.toString() || resData?.PurchaseOrder?.id?.toString() || `SYNCED-${Date.now()}`;
      
      return { status: 'success', daftraId };
    } catch(err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('فشل تقني في رفع أمر الشراء: ' + err.message);
    }
  }

  /**
   * Push an Expense (Petty Cash/Site Expense) to Daftra
   */
  async pushExpense(expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { project: true }
    });

    if (!expense) throw new BadRequestException('المصروف غير موجود');
    
    const { apiKey, domain } = await this.getDaftraConfig();

    const daftraPayload: any = {
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
      let resData: any = {};
      try { resData = JSON.parse(rawText); } catch(e) {}

      if (!response.ok || resData.code === 400 || resData.error) {
         throw new BadRequestException(`فشل ترحيل المصروف لدفترة. الرد: ${rawText}`);
      }

      const daftraId = resData?.id?.toString() || resData?.Expense?.id?.toString();
      
      return { status: 'success', daftraId };
    } catch(err: any) {
        if (err instanceof BadRequestException) throw err;
        throw new BadRequestException('فشل تقني في ترحيل المصروف: ' + err.message);
    }
  }

  /**
   * Sync payment status from Daftra for an Invoice
   */
  async syncInvoicePaymentStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { contract: true }
    });

    if (!invoice || !invoice.daftraInvoiceId) {
      throw new BadRequestException('المستخلص غير مربوط بدفترة!');
    }

    const { apiKey, domain } = await this.getDaftraConfig();
    const isMainContract = invoice.contract.type === 'MAIN_CONTRACT';
    
    // Main contracts use invoices, subcontracts use purchase_invoices
    const endpoint = isMainContract ? 'invoices' : 'purchase_invoices';
    
    try {
      const response = await fetch(`https://${domain}.daftra.com/api2/${endpoint}/${invoice.daftraInvoiceId}`, {
        method: 'GET',
        headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // ✅ الميزة الجديدة: إذا تم حذف المستند من دفترة، أعد المستخلص لحالة المسودة
          await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: 'DRAFT',
              daftraInvoiceId: null,
              paymentStatus: 'UNPAID',
              paidAmount: 0,
            }
          });
          throw new BadRequestException(
            'تنبيه: لم يتم العثور على المستند في دفترة (قد يكون محذوفاً). ' +
            'تم إعادة المستخلص تلقائياً إلى حالة المسودة حتى تتمكن من إعادة الترحيل.'
          );
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

      // Check explicit payment_status if due amount isn't reliable
      const daftraStatus = daftraDoc.payment_status || daftraDoc.status; // status=3 or 2 in some APIs means Paid

      if (daftraStatus === 3 || daftraStatus === 2 || daftraStatus === "Paid" || daftraStatus === "مدفوع") {
         payStatus = "PAID";
         paidAmt = totalAmount;
      } else if (totalAmount > 0) {
        if (dueAmount <= 0) {
          payStatus = "PAID";
          paidAmt = totalAmount;
        } else if (dueAmount < totalAmount) {
          payStatus = "PARTIAL";
          paidAmt = totalAmount - dueAmount;
        }
      }

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { paymentStatus: payStatus, paidAmount: paidAmt }
      });

      return { paymentStatus: payStatus, paidAmount: paidAmt, daftraRaw: resData };
    } catch (err: any) {
      throw new BadRequestException(`فشل استرداد حالة السداد من دفترة: ${err.message}`);
    }
  }

  /**
   * Sync Purchase Order status from Daftra - auto-reverts to PENDING if deleted (404)
   */
  async syncPurchaseOrderStatus(poId: string, daftraId: string) {
    const { apiKey, domain } = await this.getDaftraConfig();

    try {
      const response = await fetch(`https://${domain}.daftra.com/api2/purchase_orders/${daftraId}`, {
        method: 'GET',
        headers: { 'APIKEY': apiKey, 'Accept': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // إعادة أمر الشراء لحالة المسودة إذا تم حذفه من دفترة
          await this.prisma.purchaseOrder.update({
            where: { id: poId },
            data: { status: 'PENDING', daftraId: null }
          });
          throw new BadRequestException(
            'تنبيه: لم يتم العثور على أمر الشراء في دفترة (قد يكون محذوفاً). ' +
            'تم إعادته تلقائياً إلى حالة المسودة حتى تتمكن من إعادة الترحيل.'
          );
        }
        throw new Error(`فشل الاتصال بدفترة: ${response.status}`);
      }

      const resData = await response.json();
      const poData = resData.data?.PurchaseOrder || resData.PurchaseOrder || resData.data || {};
      return { status: 'synced', daftraData: poData };
    } catch (err: any) {
      throw new BadRequestException(`فشل مزامنة أمر الشراء من دفترة: ${err.message}`);
    }
  }
}
