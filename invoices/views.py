from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Invoice
from .serializers import InvoiceSerializer


@api_view(['GET', 'POST'])
def invoice_list(request):
    if request.method == 'GET':
        # Synchronize invoices from Sales if the invoices table is empty
        if not Invoice.objects.exists():
            from sales.models import Sale
            from datetime import timedelta
            
            # Let's sync the 150 most recent sales records into invoices
            sales_to_sync = Sale.objects.all().order_by('-sale_date')[:150]
            invoices_to_create = []
            
            for sale in sales_to_sync:
                inv_num = sale.invoice_number or f"INV-2026-{sale.id:04d}"
                # Avoid duplicate invoice number violations
                if Invoice.objects.filter(invoice_number=inv_num).exists():
                    continue
                
                status_map = {
                    'PAID': 'PAID',
                    'PENDING': 'UNPAID',
                    'FAILED': 'UNPAID'
                }
                inv_status = status_map.get(sale.payment_status, 'UNPAID')
                amt_paid = sale.total_price if inv_status == 'PAID' else 0.0
                
                # Check for duplicate in the current batch list
                if any(x.invoice_number == inv_num for x in invoices_to_create):
                    continue
                    
                invoices_to_create.append(Invoice(
                    invoice_number=inv_num,
                    customer_name=sale.customer_name,
                    invoice_date=sale.sale_date,
                    due_date=sale.sale_date + timedelta(days=14),
                    subtotal=sale.total_price,
                    total_amount=sale.total_price,
                    discount_amount=sale.discount or 0.0,
                    amount_paid=amt_paid,
                    status=inv_status,
                    notes=sale.notes or f"Generated automatically from Sale #{sale.id}."
                ))
            
            if invoices_to_create:
                Invoice.objects.bulk_create(invoices_to_create)

        invoices = Invoice.objects.all()
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    serializer = InvoiceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def invoice_detail(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)

    if request.method == 'GET':
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = InvoiceSerializer(invoice, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    invoice.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
