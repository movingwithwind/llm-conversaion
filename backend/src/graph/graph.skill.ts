export const generateGraphTool = {
  type: "function" as const,
  name: "generate_graph",
  description: `通用结构化分析工具。适用于多维拆解、流程步骤、决策分支等问题，输入统一树结构，输出图节点与边，必须严格遵守参数标准，"graph": "The structural representation of the graph. IMPORTANT: Return as a nested JSON object, NOT as a stringified JSON string."`,
  strict: true,
  parameters: {
      type: "object",
      properties: {
          layout: {
              type: "string",
              enum: ["Radial layout", "Hierarchical layout"],
              description: "可选的图布局方式，Radial layout（径向布局）适合展示发散结构，Hierarchical layout（层次布局）适合展示流程/决策树/多维拆解结构。"
          },
          graph: {
              $ref: "#/$defs/graphNode"
          }
      },
      required: ["graph", "layout"],
      additionalProperties: false,
      $defs: {
          graphNode: {
              type: "object",
              properties: {
                  title: {
                      type: "string",
                      description: "节点标题"
                  },
                  description: {
                      type: "string",
                      description: "节点描述"
                  },
                  children: {
                      type: "array",
                      items: {
                          type: "object",
                          properties: {
                              condition: {
                                  type: "string",
                                  description: "从父节点到该子节点的关系，是语义上的链接，而非序号字段，即时对于流程结构也是这样"
                              },
                              node: {
                                  $ref: "#/$defs/graphNode"
                              }
                          },
                          required: ["condition", "node"],
                          additionalProperties: false
                      }
                  }
              },
              required: ["title", "description", "children"],
              additionalProperties: false
          }
      }
  },
};
