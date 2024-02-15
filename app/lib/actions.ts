'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
// validate types
export async function createInvoice(formData: FormData) {
  console.log('formdata', formData);
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // convert data
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // insert values in db
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  // once inserting, revalidate to cache for up-to date data,
  // fresh data is fetched from the server
  revalidatePath('/dashboard/invoices');
  // once data is revalidated, redirect back:
  redirect('/dashboard/invoices');
}
