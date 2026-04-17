import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function test() {
  const settings = await prisma.systemSetting.findMany();
  let domain = 'gkke';
  let apiKey = '';
  for (const s of settings) {
    if (s.key === 'DAFTRA_DOMAIN') domain = s.value;
    if (s.key === 'DAFTRA_API_KEY') apiKey = s.value;
  }

  if (!apiKey) {
    console.log("No API key found in DB");
    return;
  }

  try {
    const res1 = await axios.get(`https://${domain}.daftra.com/api2/purchase_invoices/300`, {
      headers: { APIKEY: apiKey, Accept: 'application/json' },
      validateStatus: () => true
    });
    console.log("=== PURCHASE_INVOICES/300 ===");
    console.log(JSON.stringify(res1.data, null, 2));

    const res2 = await axios.get(`https://${domain}.daftra.com/api2/purchase_orders/300`, {
      headers: { APIKEY: apiKey, Accept: 'application/json' },
      validateStatus: () => true
    });
    console.log("=== PURCHASE_ORDERS/300 ===");
    console.log(JSON.stringify(res2.data, null, 2));

  } catch (err: any) {
    console.error(err.message);
  }
}

test();
