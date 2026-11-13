/**
 * dsh-dfm — 可制造性检查清单与报价准备
 */

export const name = "dsh-dfm";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

const CHECKLISTS = {
  cnc: ["最小内圆角与刀具半径", "深孔深径比 ≤ 5（>5 需深孔钻）", "最薄壁 ≥ 0.5mm（铝可 0.8）", "装夹面与基准", "公差与表面粗糙度是否可达", "是否需要五轴/电火花"],
  sheetmetal: ["折弯半径 ≥ 板厚", "孔到折弯 ≥ 2.5T+R", "翻边高度 ≥ 4T", "展开图与折弯扣除", "焊接/铆接位置", "表面处理前处理"],
  injection: ["壁厚均匀（2–3mm 常见）", "脱模角 ≥ 0.5°（纹理面 ≥ 3°）", "筋厚 ≤ 0.6T", "内圆角 ≥ 0.5T", "缩水率补偿", "浇口位置与熔接线"],
  "die-casting": ["壁厚 ≥ 1mm（锌 0.6）", "脱模角 ≥ 1°", "投影面积与锁模力", "排气与溢流", "顶针位置", "后加工余量"],
  "3d-printing": ["最小壁厚 ≥ 0.8mm（FDM）", "悬垂 ≤ 45° 或加支撑", "孔径补偿", "装配间隙 0.2–0.3mm", "打印方向与强度", "后处理（打磨/喷涂）"],
};

const COST_DRIVERS = {
  cnc: ["材料去除量", "公差精度", "装夹次数", "刀具磨损", "表面处理"],
  sheetmetal: ["板材与利用率", "折弯刀次", "焊接长度", "表面处理", "模具/工装"],
  injection: ["模具费摊销", "材料单价", "腔数与周期", "后加工", "报废率"],
  "die-casting": ["模具费", "材料", "吨位与节拍", "后加工（去毛刺/机加）", "表面处理"],
  "3d-printing": ["材料体积", "打印时间", "支撑", "后处理", "小批量单价"],
};

const TOOLS = {
  dfm_checklist: {
    description: "按工艺给 DFM 检查清单（CNC/钣金/注塑/压铸/3D 打印）",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: { process: { type: "string", enum: ["cnc", "sheetmetal", "injection", "die-casting", "3d-printing"], description: "工艺" } },
      required: ["process"],
    },
    run(args) {
      const p = String(args.process || "").toLowerCase();
      const list = CHECKLISTS[p];
      if (!list) throw new Error("支持: " + Object.keys(CHECKLISTS).join(" / "));
      const lines = ["DFM 检查清单 — " + p, "=".repeat(52)];
      list.forEach((x, i) => lines.push((i + 1) + ". " + x));
      lines.push("");
      lines.push("更多工具：" + SITE);
      return lines.join(NL);
    },
  },
  quote_prepare: {
    description: "报价准备：列出需要的输入与主要成本项，避免来回补资料",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        process: { type: "string", enum: ["cnc", "sheetmetal", "injection", "die-casting", "3d-printing"], description: "工艺" },
        quantity: { type: "number", description: "数量" },
      },
      required: ["process"],
    },
    run(args) {
      const p = String(args.process || "").toLowerCase();
      const drivers = COST_DRIVERS[p];
      if (!drivers) throw new Error("支持: " + Object.keys(COST_DRIVERS).join(" / "));
      const lines = ["报价准备 — " + p, "=".repeat(52), "数量: " + (args.quantity != null ? String(args.quantity) : "未填"), ""];
      lines.push("需要提供:");
      lines.push("- 3D 模型（STEP/IGES）或 2D 图纸（PDF/DWG）");
      lines.push("- 材料牌号与表面处理");
      lines.push("- 关键公差与检验要求");
      lines.push("- 数量与交期");
      lines.push("- 是否含模具/工装");
      lines.push("");
      lines.push("主要成本项:");
      drivers.forEach((x) => lines.push("- " + x));
      lines.push("");
      lines.push("更多工具：" + SITE);
      return lines.join(NL);
    },
  },
};

export function apply(ctx, config) {
  void config;
  for (const name of Object.keys(TOOLS)) {
    const t = TOOLS[name];
    ctx.tools.register({
      name: name,
      description: t.description,
      parameters: t.parameters,
      output: TEXT_OUTPUT,
      async execute(args) { try { return { text: t.run(args || {}) }; } catch (e) { return { text: "处理失败: " + String((e && e.message) || e) }; } },
    });
  }
}
