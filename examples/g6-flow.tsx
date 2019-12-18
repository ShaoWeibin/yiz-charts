import React, { PureComponent } from "react";
import lodash from "lodash";
import { Graph, registerNode, registerEdge } from "../src";
import * as dagre from "dagre";

/**
 * node 特殊属性
 */
const nodeExtraAttrs = {
  begin: {
    fill: "#69C0FF",
    activeFill: "#40A9FF"
  },
  end: {
    fill: "#95DE64",
    activeFill: "#73D13D"
  }
};

const flowData = {
  nodes: [
    {
      id: "1",
      label: "请求回放1（开始）",
      type: "begin",
      selected: true
    },
    {
      id: "2",
      label: "交易创建",
      selected: true
    },
    {
      id: "3",
      label: "请求回放3"
    },
    {
      id: "4",
      label: "请求回放4"
    },
    {
      id: "5",
      label: "请求回放5"
    },
    {
      id: "6",
      label: "请求回放6"
    },
    {
      id: "7",
      label: "请求回放2（结束）",
      type: "end",
      selected: true
    }
  ],
  edges: [
    {
      source: "1",
      target: "2",
      active: true
    },
    {
      source: "1",
      target: "3"
    },
    {
      source: "2",
      target: "5",
      active: true
    },
    {
      source: "5",
      target: "6"
    },
    {
      source: "6",
      target: "7"
    },
    {
      source: "3",
      target: "4"
    },
    {
      source: "4",
      target: "7"
    }
  ]
};

/**
 * 自定义节点
 */
registerNode(
  "node",
  {
    drawShape: function drawShape(cfg, group) {
      let activeStyle = {};
      // node 已选中
      if (cfg.selected) {
        const style = nodeExtraAttrs[cfg.type];
        activeStyle = {
          fill: (style && style.activeFill) || "#FFA940",
          shadowColor: "rgba(0,0,0,.15)",
          shadowOffsetX: 2,
          shadowOffsetY: 2,
          shadowBlur: 10
        };
      }

      const rect = group.addShape("rect", {
        attrs: {
          x: -75,
          y: -25,
          width: 150,
          height: 50,
          radius: 4,
          // stroke: "#00C0A5",
          // fill: "#FFA940",
          fill: "#FFC069",
          fillOpacity: 1,
          // lineWidth: 2,
          ...nodeExtraAttrs[cfg.type],
          ...activeStyle
        }
      });
      return rect;
    },
    // 设置状态
    // TODO 未使用, 全部状态由外部传入的 selected 控制, 防止两套控制逻辑导致样式不同步
    setState(name, value, item) {
      const group = item.getContainer();
      const shape = group.get("children")[0]; // 顺序根据 draw 时确定
      const { type } = item._cfg.model;

      if (name === "selected") {
        const style = nodeExtraAttrs[type];
        if (value) {
          shape.attr("fill", (style && style.activeFill) || "#FFA940");
        } else {
          shape.attr("fill", (style && style.fill) || "#FFC069");
        }
      }
    },
    getAnchorPoints: function getAnchorPoints() {
      return [[0, 0.5], [1, 0.5]];
    }
  },
  "single-shape"
);

/**
 * 自定义 edge 中心关系节点
 */
registerNode(
  "statusNode",
  {
    drawShape: function drawShape(cfg, group) {
      const circle = group.addShape("circle", {
        attrs: {
          x: 0,
          y: 0,
          r: 6,
          // fill: '#ccc',
          fill: cfg.active ? "#B37FEB" : "#ccc"
        }
      });
      // const text = group.addShape('text', {
      //   attrs: {
      //    x: 0,
      //    y: -20,
      //    textAlign: 'center',
      //    text: cfg.label,
      //    fill: '#444'
      //   }
      // });
      return circle;
    }
  },
  "single-shape"
);

/**
 * 自定义带箭头的贝塞尔曲线 edge
 */
registerEdge("line-with-arrow", {
  itemType: "edge",
  draw: function draw(cfg, group) {
    const startPoint = cfg.startPoint;
    const endPoint = cfg.endPoint;
    const centerPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    };
    // 控制点坐标
    const controlPoint = {
      x: (startPoint.x + centerPoint.x) / 2,
      y: startPoint.y
    };

    // 为了更好的展示效果, 对称贝塞尔曲线需要连到箭头根部
    const path = group.addShape("path", {
      attrs: {
        path: [
          ["M", startPoint.x, startPoint.y],
          [
            "Q",
            controlPoint.x + 8,
            controlPoint.y,
            centerPoint.x,
            centerPoint.y
          ],
          ["T", endPoint.x - 8, endPoint.y],
          ["L", endPoint.x, endPoint.y]
        ],
        stroke: "#ccc",
        lineWidth: 1.6,
        // startArrow: {
        //   path: "M 6,0 L -6,-6 L -6,6 Z",
        //   d: 6
        // },
        endArrow: {
          path: "M 4,0 L -4,-4 L -4,4 Z",
          d: 4
        }
      }
    });

    // 计算贝塞尔曲线上的中心点
    // 参考资料 https://stackoverflow.com/questions/54216448/how-to-find-a-middle-point-of-a-beizer-curve
    // const lineCenterPoint = {
    //   x:
    //     (1 / 8) * startPoint.x +
    //     (3 / 8) * (controlPoint.x + 8) +
    //     (3 / 8) * centerPoint.x +
    //     (1 / 8) * (endPoint.x - 8),
    //   y:
    //     (1 / 8) * startPoint.y +
    //     (3 / 8) * controlPoint.y +
    //     (3 / 8) * centerPoint.y +
    //     (1 / 8) * endPoint.y
    // };

    // 在贝塞尔曲线中心点上添加圆形
    const { source, target } = cfg;
    group.addShape("circle", {
      attrs: {
        id: `statusNode${source}-${target}`,
        r: 6,
        x: centerPoint.x,
        y: centerPoint.y,
        fill: cfg.active ? "#AB83E4" : "#ccc"
      }
    });

    return path;
  }
});

export interface Props {
  value: object;
  // language: string;
  style: any;
  fontSize: number;
  onChange: (value: object) => void;
  onClickNode: (item: object) => void;
  onClickRelatedNode: (item: object) => void;
}

export default class extends PureComponent<Props> {
  /**
   * 计算布局
   */
  calcLayout = originData => {
    // 深拷贝原始数据
    const data = lodash.cloneDeep(originData);

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(function () {
      return {};
    });
    g.setGraph({
      rankdir: "LR" // 左右布局
    });

    data.nodes.forEach(function (node) {
      // node.label = node.id;
      g.setNode(node.id, {
        width: 150,
        height: 50,
        anchor: "middle"
      });
    });

    data.edges.forEach(function (edge) {
      g.setEdge(edge.source, edge.target, { anchor: "middle" });
    });
    dagre.layout(g);

    // 获取节点坐标
    var coord = void 0;
    g.nodes().forEach(function (node, i) {
      coord = g.node(node);
      data.nodes[i].x = coord.x;
      data.nodes[i].y = coord.y;
    });

    // 获取 edge 坐标
    g.edges().forEach(function (edge, i) {
      coord = g.edge(edge);
      const startPoint = coord.points[0];
      const endPoint = coord.points[coord.points.length - 1];
      data.edges[i].startPoint = startPoint;
      data.edges[i].endPoint = endPoint;
      data.edges[i].controlPoints = coord.points.slice(
        1,
        coord.points.length - 1
      );
    });

    return data;
  };

  /**
   * 单击节点
   */
  handleClickNode = (graph, ev) => {
    const { onClickNode } = this.props;
    const node = ev.item;

    // 移除其他节点的选中态
    // const nodes = graph.findAll("node", node => {
    //   // console.info(node);
    //   return node._cfg.currentShape === "node";
    // });
    // nodes.forEach(node => graph.setItemState(node, "selected", false));

    // 选中当前节点
    // graph.setItemState(node, "selected", !node.hasState("selected")); // 切换选中

    // console.info({ ...node._cfg.model });
    onClickNode({ ...node._cfg.model });
  };

  /**
   * 单击边
   */
  handleClickEdge = (graph, ev) => {
    const { onClickRelatedNode } = this.props;
    const { target } = ev;
    const type = target.get("type");
    const node = ev.item;

    // 点击状态节点
    if (type === "circle") {
      // console.info({ id: node._cfg.id, ...node._cfg.model });
      onClickRelatedNode({ id: node._cfg.id, ...node._cfg.model });
    }
  };

  render() {
    const { value = flowData, style = {}, fontSize } = this.props;
    // 计算原始数据布局
    const data = this.calcLayout(value);

    return (
      <Graph
        width={style.width || '100%'}
        height={style.height || '100%'}
        padding={16}
        background="#F6F6F6"
        data={data}
        pixelRatio={2}
        minZoom={0.5}
        maxZoom={2}
        modes={{
          default: ["drag-canvas", "zoom-canvas"]
        }}
        defaultNode={{
          shape: "node",
          labelCfg: {
            style: {
              fill: "#fff",
              fontSize: 14
              // fontWeight: "bold"
            }
          }
        }}
        defaultEdge={{
          shape: "line-with-arrow"
          // shape: "cubic-horizontal"
        }}
        edgeStyle={{
          default: {
            endArrow: true,
            lineWidth: 2,
            stroke: "#ccc"
          }
        }}
        onNodeClick={this.handleClickNode}
        onEdgeClick={this.handleClickEdge}
      />
    );
  }
}