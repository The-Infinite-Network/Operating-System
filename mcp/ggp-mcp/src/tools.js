import { getSupabaseClient } from "./config.js";
import { MCPError, ErrorCodes } from "./errors.js";

const requireParam = (value, name) => {
  if (value === undefined || value === null || value === "") {
    throw new MCPError(ErrorCodes.BAD_REQUEST, `${name} is required`, { name });
  }
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new MCPError(ErrorCodes.BAD_REQUEST, "Invalid date format", {
      value,
    });
  }
  return date.toISOString().slice(0, 10);
};

export class Tools {
  constructor(authToken) {
    this.supabase = getSupabaseClient(authToken);
  }

  async get_daily_snapshot(params = {}) {
    const { date, unit_id } = params;
    requireParam(date, "date");
    requireParam(unit_id, "unit_id");

    const snapshotDate = normalizeDate(date);
    const { data, error } = await this.supabase
      .from("daily_financials")
      .select("sales,labor_cost,cogs,red_list_count")
      .eq("unit_id", unit_id)
      .eq("date", snapshotDate)
      .maybeSingle();

    if (error) {
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, error.message, error);
    }

    if (!data) {
      return {
        date: snapshotDate,
        unit_id,
        sales: 0,
        labor_percent: 0,
        cogs_percent: 0,
        red_list_count: 0,
      };
    }

    const sales = data.sales || 0;
    const laborPercent = sales > 0 ? (data.labor_cost / sales) * 100 : 0;
    const cogsPercent = sales > 0 ? (data.cogs / sales) * 100 : 0;

    return {
      date: snapshotDate,
      unit_id,
      sales,
      labor_percent: Number(laborPercent.toFixed(2)),
      cogs_percent: Number(cogsPercent.toFixed(2)),
      red_list_count: data.red_list_count || 0,
    };
  }

  async audit_cash_log(params = {}) {
    const { date } = params;
    requireParam(date, "date");
    const auditDate = normalizeDate(date);

    const { data, error } = await this.supabase
      .from("cash_drawers")
      .select("id,unit_id,cashier,expected,actual,variance,created_at,date")
      .eq("date", auditDate)
      .gt("variance", 5)
      .order("variance", { ascending: false });

    if (error) {
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, error.message, error);
    }

    const { data: negativeVariance, error: negativeError } = await this.supabase
      .from("cash_drawers")
      .select("id,unit_id,cashier,expected,actual,variance,created_at,date")
      .eq("date", auditDate)
      .lt("variance", -5)
      .order("variance", { ascending: true });

    if (negativeError) {
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, negativeError.message, negativeError);
    }

    return [...(data || []), ...(negativeVariance || [])];
  }

  async query_roster(params = {}) {
    const { role_filter } = params;
    let query = this.supabase
      .from("roster")
      .select("id,name,wage,role,cert_status,pals_day,unit_id")
      .eq("active", true);

    if (role_filter) {
      query = query.ilike("role", `%${role_filter}%`);
    }

    const { data, error } = await query.order("role", { ascending: true });
    if (error) {
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, error.message, error);
    }
    return data || [];
  }

  async submit_incident_report(params = {}) {
    const { type, severity, description, unit_id, userContext } = params;
    requireParam(type, "type");
    requireParam(severity, "severity");
    requireParam(description, "description");
    requireParam(unit_id, "unit_id");

    const payload = {
      unit_id,
      type,
      severity,
      description,
      created_by: userContext?.userName || userContext?.userHandle || null,
    };

    const { data, error } = await this.supabase
      .from("incident_reports")
      .insert(payload)
      .select("id,unit_id,type,severity,description,created_by,created_at")
      .single();

    if (error) {
      throw new MCPError(ErrorCodes.INTERNAL_ERROR, error.message, error);
    }

    return data;
  }
}
