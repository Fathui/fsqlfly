import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import moment from 'moment';
import { connect } from 'dva';
import { DownOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import {
  List,
  Card,
  Input,
  Progress,
  Button,
  Dropdown,
  Menu,
  Modal,
  Tag,
  Tooltip, Row, Col, Switch,
} from 'antd';
import { FormComponentProps } from '@ant-design/compatible/es/form';
import { Connection, ResourceName, ResourceTemplate, ResourceVersion } from '@/pages/resources/data';
import { Dispatch } from 'redux';
import Result from '@/pages/resources/components/Result';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { cutStr, getStatus } from '@/utils/utils';

const FormItem = Form.Item;
const { Search } = Input;
import { AnyAction } from 'redux';
import { UNIQUE_NAME_RULES } from '@/utils/UNIQUE_NAME_RULES';
// @ts-ignore
import styles from '@/pages/resources/style.less';
import { UserModelState } from '@/models/user';
import AceEditor from 'react-ace';
import 'brace/mode/yaml';

interface BasicListProps extends FormComponentProps {
  listBasicList: ResourceVersion[];
  connections: Connection[];
  names: ResourceName[];
  templates: ResourceTemplate[];
  dispatch: Dispatch<AnyAction>;
  total: number;
  loading: boolean;
  fetchLoading: boolean;
  deletable: boolean;
  match: { params: { id: number, nid: number, vid: number } }
}

interface BasicListState {
  visible: boolean;
  runVisible: boolean;
  runDone: boolean;
  done: boolean;
  current?: Partial<ResourceVersion>;
  search: string;
  config: string;
  type: string;
  msg: string;
  success: boolean;
  submitted: boolean;
}

const NAMESPACE = 'version';

@connect(
  ({
     version,
     loading,
     total,
     user,
   }: {
    version: { list: ResourceVersion[], dependence: Connection, dependence1: ResourceName, dependence2: ResourceTemplate };
    loading: {
      models: { [key: string]: boolean };
      effects: { [key: string]: boolean };
    };
    total: number;
    user: UserModelState
  }) => ({
    listBasicList: version.list,
    connections: version.dependence,
    names: version.dependence1,
    templates: version.dependence2,
    loading: loading.models.version,
    fetchLoading: loading.effects['version/fetch'],
    deletable: user.currentUser?.deletable,
  }),
)
class BasicList extends Component<BasicListProps, BasicListState> {
  state: BasicListState = {
    visible: false,
    runVisible: false,
    runDone: false,
    done: false,
    current: undefined,
    search: '',
    msg: '',
    success: false,
    submitted: false,
    config: '',
    type: '',
  };

  formLayout = {
    labelCol: { span: 5 },
    wrapperCol: { span: 17 },
  };
  addBtn: HTMLButtonElement | undefined | null;

  componentDidMount() {
    // @ts-ignore
    this.doRefresh();
  }

  getCurrentConnectionId = () => {
    const { match } = this.props;
    const { id } = match.params;
    return id;
  };


  getCurrentConnectionType = () => {
    const { connections } = this.props;
    const id = this.getCurrentConnectionId();
    const connection = connections.filter(x => x.id === id);
    return connection.length >= 1 ? connection[0].type : 'unknown';
  };

  getCurrentNameId = () => {
    const { match } = this.props;
    const { nid } = match.params;
    return nid;
  };

  getTemplateId = () => {
    const { match } = this.props;
    const { vid } = match.params;
    return vid;
  };

  getFullName = (s: string) => {
    const { connections, names, templates } = this.props;
    const id = this.getCurrentConnectionId();
    const [connection = { name: 'test' }] = connections.filter(x => x.id === id);
    const nid = this.getCurrentNameId();
    const [name = { name: 'n', database: null }] = names.filter(x => x.id === nid);
    const tid = this.getTemplateId();

    const [template = { name: 'n' }] = templates.filter(x => x.id === tid);
    return connection.name + '.' + (name.database === undefined || name.database === null ? name.name : `${name.database}.${name.name}`) + '.' + template.name + '.' + s;
  };

  getMaxVersion = () => {
    const { listBasicList } = this.props;
    let maxVersion = 0;
    listBasicList.forEach(
      x => {
        maxVersion = Math.max(x.version, maxVersion);
      },
    );
    return maxVersion;
  };


  doRefresh = () => {
    const { dispatch } = this.props;
    dispatch({
      type: `${NAMESPACE}/fetch`,
      payload: {
        connection_id: this.getCurrentConnectionId(),
        resource_name_id: this.getCurrentNameId(),
        template_id: this.getTemplateId(),
      },
    });
  };

  showModal = () => {
    this.setState({
      visible: true,
      submitted: false,
      current: {},
      config: '',
    });
  };

  showEditModal = (item: ResourceVersion) => {
    this.setState({
      visible: true,
      current: item,
      submitted: false,
      config: item.config === undefined ? '' : item.config,
    });
  };

  showCopyCreateModal = (item: ResourceVersion) => {
    const newItem = { ...item };
    delete newItem.id;
    delete newItem.createAt;
    delete newItem.updateAt;
    newItem.isSystem = false;

    this.setState({
      visible: true,
      current: newItem,
      submitted: false,
      config: item.config === undefined || item.config === null ? '' : item.config,
    });
  };

  showManageModal = (item: ResourceVersion, mode: string) => {
    this.setState({
      runVisible: true,
      runDone: false,
      msg: '',
    });
    const { dispatch } = this.props;
    dispatch({
      type: `${NAMESPACE}/run`,
      payload: { method: mode, model: NAMESPACE, id: item.id },
      callback: (res: { msg: string; success: boolean }) => {
        this.setState({
          msg: res.msg,
          runDone: true,
          success: res.success,
        });
      },
    });
  };

  handleDone = () => {
    setTimeout(() => this.addBtn && this.addBtn.blur(), 0);

    this.setState({
      done: false,
      visible: false,
    });
  };

  handleCancel = () => {
    setTimeout(() => this.addBtn && this.addBtn.blur(), 0);
    this.setState({
      visible: false,
    });
  };

  handleSubmit = (e: React.FormEvent, isUpdate?: boolean) => {
    e.preventDefault();
    // @ts-ignore
    const { dispatch, form } = this.props;
    const { current } = this.state;

    setTimeout(() => this.addBtn && this.addBtn.blur(), 0);
    form.validateFields((err: string | undefined, fieldsValue: ResourceName) => {
      if (err) return;
      this.setState({ submitted: true });
      const fullName = this.getFullName(fieldsValue['name']);
      if (current?.version === undefined || current?.version === null) {
        fieldsValue['version'] = this.getMaxVersion() + 1;
      }
      dispatch({
        type: `${NAMESPACE}/submit`,
        payload: {
          ...current, ...fieldsValue,
          fullName,
          connectionId: this.getCurrentConnectionId(),
          resourceNameId: this.getCurrentNameId(),
          templateId: this.getTemplateId(),
        },
        callback: (res: { success: boolean; msg: string }) => {
          if (res.success) {
            this.setState({
              done: true,
              success: res.success,
              msg: res.msg,
            });
          } else {
            this.setState({
              runDone: true,
              success: res.success,
              msg: res.msg,
              submitted: false,
              runVisible: true,
            });
          }
        },
      });
    });
  };

  deleteItem = (id: number) => {
    // @ts-ignore
    const { dispatch } = this.props;
    dispatch({
      type: `${NAMESPACE}/submit`,
      payload: { id },
    });
  };

  onSearch = (value: string, event?: any) => {
    this.setState({ search: value });
  };

  getFilterPageData = () => {
    const { search } = this.state;
    const { listBasicList } = this.props;
    console.log(listBasicList.length);
    const res = listBasicList.filter(
      x => (search.length === 0 || x.fullName.indexOf(search) >= 0 || (x.name !== undefined && x.name !== null ? x.name.indexOf(search) > 0 : x.version.toString().indexOf(search) > 0)),
    );
    console.log(res.length);
    console.log(res);
    return res;
  };


  render() {
    const { loading } = this.props;
    const {
      form: { getFieldDecorator },
      fetchLoading,
    } = this.props;

    const {
      visible,
      done,
      current = {},
      search,
      success,
      msg,
      submitted,
    } = this.state;

    const editAndDelete = (key: string, currentItem: ResourceVersion) => {
      if (key === 'edit') this.showEditModal(currentItem);
      else if (key == 'update') this.showManageModal(currentItem, 'update');
      else if (key == 'copy') this.showCopyCreateModal(currentItem);
      else if (key == 'upgrade') this.showManageModal(currentItem, 'upgrade');
      else if (key === 'delete') {
        Modal.confirm({
          title: '删除',
          content: '确定删除吗？',
          okText: '确认',
          cancelText: '取消',
          onOk: () => this.deleteItem(currentItem.id),
        });
      }
    };
    const modalFooter = done
      ? { footer: null, onCancel: this.handleDone }
      : {
        okText: '保存',
        onOk: this.handleSubmit,
        onCancel: this.handleCancel,
        footer: [
          <Button key="back" onClick={this.handleCancel}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitted} onClick={this.handleSubmit}>
            保存
          </Button>,
        ],
      };

    const extraContent = (
      <div className={styles.extraContent}>
        <Button onClick={this.doRefresh} disabled={fetchLoading}>
          <ReloadOutlined/>
        </Button>
        <Search
          defaultValue={search}
          className={styles.extraContentSearch}
          placeholder="请输入"
          onSearch={this.onSearch}
        />
      </div>
    );
    const ListContent = ({
                           data: { version, isDefault, isSystem, isLocked, createAt, updateAt },
                         }: {
      data: ResourceVersion;
    }) => (
      <div className={styles.listContent}>
        <div className={styles.listContentItem}>
          <p>
            <Tag>V{version}</Tag>
          </p>
        </div>
        <div className={styles.listContentItem}>
          <span>创建时间</span>
          <p>{moment(createAt).format('YYYY-MM-DD HH:mm')}</p>
        </div>
        <div className={styles.listContentItem}>
          <span>修改时间</span>
          <p>{moment(updateAt).format('YYYY-MM-DD HH:mm')}</p>
        </div>
        <div className={styles.listContentItem}>
          <Progress
            type="circle"
            percent={100}
            status={getStatus(isDefault, isLocked)}
            strokeWidth={1}
            width={50}
            style={{ width: 180 }}
          />
        </div>
      </div>
    );

    const { deletable } = this.props;
    const MoreBtn: React.SFC<{
      item: ResourceVersion;
    }> = ({ item }) => (
      <Dropdown
        overlay={
          <Menu onClick={({ key }) => editAndDelete(key, item)}>
            {deletable && <Menu.Item key="delete">删除</Menu.Item>}
            <Menu.Item key="update">更新</Menu.Item>
            <Menu.Item key="copy">复制</Menu.Item>
          </Menu>
        }
      >
        <a>
          更多 <DownOutlined/>
        </a>
      </Dropdown>
    );
    const getModalContent = (isCreate: boolean) => {
      if (done) {
        return (
          <Result
            type={success ? 'success' : 'error'}
            title={`操作 ${success ? '成功' : '失败'}`}
            description={success ? '' : msg}
            actions={
              <Button type="primary" onClick={this.handleDone}>
                知道了
              </Button>
            }
            className={styles.formResult}
          />
        );
      }
      return (
        <Form onSubmit={this.handleSubmit}>
          <FormItem label="名称" {...this.formLayout}>
            {getFieldDecorator('name', {
              rules: isCreate ? UNIQUE_NAME_RULES : [],
              initialValue: current.name,
            })(<Input disabled={!isCreate} placeholder="请输入"/>)}
          </FormItem>

          <FormItem label="介绍" {...this.formLayout}>
            {getFieldDecorator('info', {
              initialValue: current.info,
              rules: [
                {
                  required: false,
                },
              ],
            })(<Input.TextArea placeholder="简介"/>)}
          </FormItem>


          <FormItem label="config" {...this.formLayout}>
            <AceEditor
              mode="yaml"
              onChange={x => this.setState({ config: x, current: {...current, config: x} })}
              name="functionConstructorConfig"
              editorProps={{ $blockScrolling: true }}
              readOnly={false}
              placeholder={'请输入Yaml配置'}
              defaultValue={current.config === null ? '' : current.config}
              value={this.state.config === null ? '' : this.state.config}
              //@ts-ignore
              width={765}
              //@ts-ignore
              height={230}
            />
          </FormItem>

          <FormItem label="其他" {...this.formLayout}>
            <Row gutter={16}>
              <Col span={3}>
                {getFieldDecorator('isDefault', {
                  initialValue: current.isDefault,
                  valuePropName: 'checked',
                })(<Switch checkedChildren="默认" unCheckedChildren="取消"/>)}
              </Col>
              <Col span={3}>
                {getFieldDecorator('isLocked', {
                  initialValue: current.isLocked,
                  valuePropName: 'checked',
                })(<Switch checkedChildren="锁" unCheckedChildren="开"/>)}
              </Col>
            </Row>
          </FormItem>


        </Form>
      );
    };
    return (
      <>
        <PageHeaderWrapper>
          <div className={styles.standardList}>
            <Card
              className={styles.listCard}
              bordered={false}
              title="列表"
              style={{ marginTop: 24 }}
              bodyStyle={{ padding: '0 32px 40px 32px' }}
              extra={extraContent}
            >
              <Button
                type="dashed"
                style={{ width: '100%', marginBottom: 8 }}
                icon={<PlusOutlined/>}
                onClick={this.showModal}
                ref={component => {
                  this.addBtn = findDOMNode(component) as HTMLButtonElement;
                }}
              >
                添加
              </Button>
              <List
                size="large"
                rowKey="id"
                loading={loading}
                dataSource={this.getFilterPageData()}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <a
                        key="edit"
                        onClick={e => {
                          e.preventDefault();
                          this.showEditModal(item);
                        }}
                      >
                        编辑
                      </a>,
                      <MoreBtn key="more" item={item}/>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Tooltip title={item.fullName} placement="left">
                          <a href="#">{cutStr(item.name)}</a>
                        </Tooltip>
                      }
                      description={
                        <Tooltip title={item.info} placement="left">
                          <a href="#">{cutStr(item.info)}</a>
                        </Tooltip>
                      }
                    />
                    <ListContent data={item}/>
                  </List.Item>
                )}
              />
            </Card>
          </div>

          <Modal
            title={`运行结果`}
            className={styles.standardListForm}
            width={1080}
            bodyStyle={{ padding: '72px 0' }}
            destroyOnClose
            visible={this.state.runVisible}
            onCancel={x => this.setState({ runVisible: false })}
            footer={null}
            confirmLoading={this.state.done}
          >
            <Result
              type={this.state.runDone ? (this.state.success ? 'success' : 'error') : 'line'}
              title={this.state.runDone ? (this.state.success ? '运行成功' : '运行失败') : `提交中...`}
              description={this.state.msg}
              actions={
                <Button
                  loading={!this.state.runDone}
                  type="primary"
                  onClick={x => this.setState({ runVisible: false })}
                >
                  知道了
                </Button>
              }
              className={styles.formResult}
            />
          </Modal>
        </PageHeaderWrapper>

        <Modal
          title={done ? null : `${current.id !== undefined ? '编辑' : '新增'}`}
          className={styles.standardListForm}
          width={1080}
          bodyStyle={done ? { padding: '72px 0' } : { padding: '28px 0 0' }}
          destroyOnClose
          visible={visible}
          {...modalFooter}
        >
          {getModalContent(current.id === undefined)}
        </Modal>
      </>
    );
  }
}

export default Form.create<BasicListProps>()(BasicList);
