import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

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
    const res1 = await fetch(`https://${domain}.daftra.com/api2/purchase_invoices/300`, {
      headers: { APIKEY: apiKey, Accept: 'application/json' },
    });
    const data1 = await res1.json();
    fs.writeFileSync('daftra-keys.txt', JSON.stringify(data1, null, 2));
    console.log("SUCCESS! Wrote response to daftra-keys.txt");
  } catch (err: any) {
    console.error(err.message);
  }
}

test();
