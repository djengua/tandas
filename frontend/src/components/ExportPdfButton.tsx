"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { tandasApi } from "@/api/tandas";
import type { TandaReport } from "@/types";
import Button from "@/components/ui/Button";

interface ExportPdfButtonProps {
  tandaId: string;
  report: TandaReport;
}

export default function ExportPdfButton({ tandaId, report }: ExportPdfButtonProps) {
  const mutation = useMutation({
    mutationFn: async () => {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text(report.tanda_nombre, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Estado: ${report.estado} | Tipo: ${report.tipo_tanda}`, 14, 30);
      doc.text(`Monto por período: $${report.monto_periodo.toFixed(2)}`, 14, 36);
      
      const summaryData = [
        ["Total Participantes", report.total_participantes.toString()],
        ["Total Rondas", report.total_rondas.toString()],
        ["Rondas Cobradas", report.rondas_cobradas.toString()],
        ["Pagos Completados", report.pagos_completados.toString()],
        ["Pagos Pendientes", report.pagos_pendientes.toString()],
        ["Monto Esperado", `$${report.monto_esperado.toFixed(2)}`],
        ["Total Recaudado", `$${report.total_recaudado.toFixed(2)}`],
        ["Progreso", `${report.porcentaje_completado}%`],
      ];
      
      autoTable(doc, {
        startY: 42,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
      });
      
      const tableData = report.detalle_participantes.map((p) => [
        p.orden?.toString() || "-",
        p.nombre_display || "Invitado",
        p.pagos_hechos.toString(),
        `$${p.monto_pagado.toFixed(2)}`,
        p.pagos_pendientes.toString(),
        `$${(p.pagos_pendientes * report.monto_periodo).toFixed(2)}`,
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [["#", "Participante", "Pagos", "Pagado", "Pendientes", "Saldo"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] },
      });
      
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Página ${i} de ${pageCount} | Generado el ${new Date().toLocaleDateString("es-MX")}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: "center" }
        );
      }
      
      doc.save(`reporte_${report.tanda_nombre.replace(/\s+/g, "_")}.pdf`);
    },
  });

  return (
    <Button
      variant="secondary"
      onClick={() => mutation.mutate()}
      loading={mutation.isPending}
      icon={<Download className="w-4 h-4" />}
    >
      Exportar PDF
    </Button>
  );
}