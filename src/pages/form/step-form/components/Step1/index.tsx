import React, { Fragment } from 'react';
import { connect } from 'dva';
import { Form, Button, Divider } from 'antd';
import { ResourceInfo } from '../../data';
import { FormComponentProps } from 'antd/es/form';
import { Dispatch } from 'redux';
import { TransferItem } from 'antd/es/transfer';
import TableTransfer from './TableTransfer';
import { ResourceColumn } from '@/pages/form/step-form/data';

interface Step1Props extends FormComponentProps {
  data?: ResourceInfo;
  dispatch: Dispatch<any>;
  sources: ResourceColumn[];
  targets: string[];
}

interface StepState {
  selectedKeys: string[];
}

class Step1 extends React.PureComponent<Step1Props, StepState> {
  state = {
    selectedKeys: [],
  };

  onChange = (nextTargetKeys: string[]) => {
    const { dispatch } = this.props;
    dispatch({
      type: 'formStepForm/updateTarget',
      payload: nextTargetKeys,
    });
  };

  componentDidMount() {
    // @ts-ignore
    const { dispatch } = this.props;
    dispatch({
      type: 'ListModel/fetch',
    });
  }

  render() {
    const { dispatch, data, sources, targets } = this.props;
    if (!data) {
      return;
    }

    const nextStep = () => {
      dispatch({
        type: 'formStepForm/saveCurrentStep',
        payload: 'confirm',
      });
    };
    const backToList = () => {
      if (!dispatch) return;
      dispatch({
        type: 'formStepForm/saveCurrentStep',
        payload: 'list',
      });
    };

    const filterSearch = (inputValue: string, item: TransferItem) => {
      return (
        item.title.indexOf(inputValue) !== -1 ||
        (item.namespace !== undefined && item.namespace.indexOf(inputValue) !== -1)
      );
    };
    return (
      <Fragment>
        <div>
          <TableTransfer
            showSearch
            showSelectAll
            dataSource={sources}
            titles={['Source', 'Target']}
            targetKeys={targets}
            selectedKeys={this.state.selectedKeys}
            onChange={this.onChange}
            onSelectChange={(sourceSelectedKeys: string[], targetSelectedKeys: string[]) =>
              this.setState({
                selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys],
              })
            }
            filterOption={filterSearch}
            rowKey={(x: ResourceColumn) => x.id}
          />
        </div>
        <Divider style={{ margin: '40px 0 24px' }} />

        <Button type="primary" onClick={nextStep}>
          下一步
        </Button>
        <Button
          type="default"
          onClick={backToList}
          style={{
            marginLeft: 8,
          }}
        >
          返回列表
        </Button>
      </Fragment>
    );
  }
}

export default connect(
  ({
    formStepForm,
  }: {
    formStepForm: ResourceInfo & {
      targetKeys: string[];
      resourceColumns: ResourceColumn[];
    };
  }) => ({
    data: formStepForm,
    sources: formStepForm.resourceColumns,
    targets: formStepForm.targetKeys,
  }),
)(Form.create<Step1Props>()(Step1));
