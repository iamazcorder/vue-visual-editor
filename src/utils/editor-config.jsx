//左侧列表区显示所有的物料
//key对应的组件映射关系

import Range from "@/components/Range";
import { ElButton, ElInput, ElOption, ElSelect } from "element-plus";

function createEditorConfig() {
  const componentList = []; //左侧渲染 
  const componentMap = {};  //中间渲染


  return {
    componentList,
    componentMap,
    //根据传入的组件的配置，生成一个组件
    register: (component) => {
      componentList.push(component)
      componentMap[component.key] = component
    }
  }
}

export let registerConfig = createEditorConfig()

//工厂函数 创建组件对应的属性
//输入框
const createInputProp = (label) => {
  return {
    type: 'input',
    label
  }
}
//字体颜色
const createColorProp = (label) => {
  return {
    type: 'color',
    label
  }
}
//选择菜单
const createSelectProp = (label, options) => {
  return {
    type: 'select',
    label,
    options
  }
}
const createTableProp = (label, table) => {
  return {
    type: 'table',
    label,
    table
  }
}


//文本
registerConfig.register({
  label: '文本',
  preview: () => '预览文本',
  render: ({ props }) => <span style={{ color: props.color, fontSize: props.size }}>{props.text || '渲染文本'}</span>,
  key: 'text',
  props: {
    text: createInputProp('文本内容'),
    color: createColorProp('字体颜色'),
    size: createSelectProp('字体大小', [
      { label: '14px', value: '14px' },
      { label: '15px', value: '15px' },
      { label: '16px', value: '16px' },
      { label: '17px', value: '17px' },
      { label: '18px', value: '18px' },
    ])
  }
})

//下拉框
registerConfig.register({
  label: '下拉框',
  preview: () => <ElSelect modelValue=""></ElSelect>,
  render: ({ props, model }) => {
    return <ElSelect {...model.default}>
      {
        (props.options || []).map((opt, index) => {
          return <ElOption label={opt.label} value={opt.value} key={index}></ElOption>
        })
      }
    </ElSelect>
  },
  key: 'select',
  props: {  //[{label:'a',value:'1'},{label:'b',value:'2'}]  用户输入label 显示value
    options: createTableProp('下拉选项', {
      options: [
        { label: '显示值', field: 'label' },
        { label: '绑定值', field: 'value' }
      ],
      key: 'label'  //显示给用户的值是label
    })
  },
  model: {
    default: '绑定字段'
  }
})


//按钮
registerConfig.register({
  label: '按钮',
  resize: {
    width: true,
    height: true
  },
  preview: () => <ElButton>预览按钮</ElButton>,
  render: ({ props, size }) => <ElButton style={{ height: size.height + 'px', width: size.width + 'px' }} type={props.type} size={props.size}>{props.text || '渲染按钮'}</ElButton>,
  key: 'button',
  props: {
    text: createInputProp('按钮内容'),
    color: createColorProp('字体颜色'),
    type: createSelectProp('按钮类型', [
      { label: '基础', value: 'default' },
      { label: '主要', value: 'primary' },
      { label: '成功', value: 'success' },
      { label: '警告', value: 'warning' },
      { label: '危险', value: 'danger' },
      { label: '文本', value: 'info' },
    ]),
    size: createSelectProp('按钮大小', [
      { label: '默认', value: '' },
      { label: '大', value: 'large' },
      { label: '小', value: 'small' },
      // { label: '极小', value: 'mini' }
    ])
  }
})


//输入框
registerConfig.register({
  label: '输入框',
  resize: {
    width: true
  },
  preview: () => <ElInput placeholder="预览输入框"></ElInput>,
  render: ({ model, size }) => <ElInput style={{ width: size.width + 'px' }} placeholder="渲染输入框" {...model.default}></ElInput>,
  key: 'input',
  model: {
    default: '绑定字段'
  }
})


//范围选择器
registerConfig.register({
  label: '范围选择器',
  key: 'range',
  preview: () => <Range></Range>,
  render: ({ model }) => {
    return <Range {...{
      start: model.start.modelValue, // @update:start
      end: model.end.modelValue,
      'onUpdate:start': model.start['onUpdate:modelValue'],
      'onUpdate:end': model.end['onUpdate:modelValue']
    }
    }></Range>
  },
  model: {
    start: '开始字段',
    end: '结束字段'
  }
})

