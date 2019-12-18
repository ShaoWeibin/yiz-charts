import React, { PureComponent, createRef } from 'react';
import G6 from '@antv/g6';

export default class Graph extends PureComponent {
  static getDerivedStateFromProps(props, state) {
    if (props.data !== state.data) {
      return {
        data: props.data,
      };
    }
  }

  constructor(props) {
    super(props);

    this.graph = null;
    this.ref = createRef();

    this.state = {
      data: props.data,
    };
  }

  componentDidMount() {
    const {
      data,
      padding = 0,
      onNodeClick,
      onEdgeClick,
      onMouseenter,
      onMouseleave,
      ...restProps
    } = this.props;

    const domEl = this.ref.current;
    const width = domEl.offsetWidth || 1200;
    const height = domEl.offsetHeight || 600;
    if (this.ref.current) {
      if (this.ref.current) {
        this.graph = new G6.Graph({
          container: this.ref.current,
          width,
          height,
          fitViewPadding: padding,
          modes: {
            default: ['drag-canvas'],
          },
          ...restProps,
        });

        this.graph.data(data);
        this.graph.render();

        // 点击节点
        this.graph.on('node:click', ev => {
          onNodeClick && onNodeClick(this.graph, ev);
        });

        // 点击边
        this.graph.on('edge:click', ev => {
          onEdgeClick && onEdgeClick(this.graph, ev);
        });

        // 延迟重新设置画布大小, 否则 容器样式为 width: 100% 时画布尺寸有误
        setTimeout(() => {
          this.resize();
        }, 0);
      }
    }

    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount() {
    if (this.graph) this.graph.destroy();
    window.removeEventListener('resize', this.resize);
  }

  componentDidUpdate() {
    const { data } = this.state;
    const graph = this.graph;
    if (graph) {
      this.resize();
      graph.clear();
      graph.data(data);
      // graph.changeData(data);
      graph.render();
    }
  }

  resize = () => {
    const { padding } = this.props;
    if (this.graph) {
      const domEl = this.ref.current;
      const width = domEl.offsetWidth || 1200;
      const height = domEl.offsetHeight || 600;
      this.graph.changeSize(width, height);
      // padding
      this.graph.fitView(padding);
    }
  };

  render() {
    const { width, height, background = 'fff' } = this.props;
    return <div style={{ width, height, background }} ref={this.ref} />;
  }
}
