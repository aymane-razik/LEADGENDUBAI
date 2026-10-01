'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateLeadDialog } from '@/components/dashboard/create-lead-dialog';
import { toast } from 'sonner';

export default function CreateLeadPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Add New Lead</h1>
        <p className="text-sm text-muted-foreground">
          Enter the lead information below. Required fields are marked.
        </p>
      </div>
      <CreateLeadDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={() => {
          toast.success('Lead created');
          router.push('/dashboard/leads');
        }}
      />
    </div>
  );
}
