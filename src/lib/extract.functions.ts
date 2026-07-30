import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSiteReport, buildDocumentation } from "./extract.server";

export const analyzeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ url: z.string().trim().min(4).max(2048) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const report = await buildSiteReport(data.url);
    const documentation = buildDocumentation(report);

    const { data: row, error } = await context.supabase
      .from("extractions")
      .insert({
        user_id: context.userId,
        url: report.url,
        title: report.title,
        data: report as unknown as Record<string, unknown>,
        documentation,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id as string, report, documentation };
  });
