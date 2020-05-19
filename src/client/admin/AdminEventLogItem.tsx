import React, { Component } from 'react';
import { TOKEN_HEADER } from '../../shared/constants';
import Axios, { AxiosRequestConfig } from 'axios';
import { IResponse } from '../../shared/ApiUsersRequestsResponds';
import moment from 'moment';
import { withRouter } from 'react-router-dom';
import ReactLoading from 'react-loading';
import { Link } from 'react-router-dom';
import { IEventLog, eventLogData } from './AdminEventLogList';
import { INotificationHandler } from './NotificationHandler';

interface IAdminEventLogItemState {
  fetching: boolean;
  eventLog?: IEventLog;
  date?: Date;
}

interface IAdminEventLogItemProps {
  notificationHandler: INotificationHandler;
  match: {
    params: {
      eventID: string;
    };
  };
}

class AdminEventLogItem extends Component<IAdminEventLogItemProps, IAdminEventLogItemState> {
  private mounted = false;
  constructor(props) {
    super(props);
    this.state = {
      fetching: true,
    };
  }
  componentDidMount() {
    this.mounted = true;
    this.getInfo();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  get eventID() {
    return this.props.match.params.eventID;
  }

  async getInfo() {
    this.setState({ fetching: true });
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.post<IResponse<IEventLog>>(
        '/api/v1/admin/event-log',
        { eventID: this.eventID },
        axiosRequestConfig,
      );
      const eventLog = response.data.success;
      if (!this.mounted) return;
      this.setState({ eventLog, date: new Date() });
    } catch (error) {}
    this.setState({ fetching: false });
  }

  removeEvent = async () => {
    this.setState({ fetching: true });
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;
    axiosRequestConfig.data = { eventID: this.eventID };
    try {
      await Axios.delete<IResponse<IEventLog>>('/api/v1/admin/event-log', axiosRequestConfig);
      if (!this.mounted) return;
      this.props.notificationHandler.info('Event Remove', `Event has been removed ${this.eventID}`);
      const event = eventLogData.eventLogs.find(e => e.id === this.eventID);
      const indexOf = eventLogData.eventLogs.indexOf(event);
      if (indexOf !== -1) {
        eventLogData.eventLogs.splice(indexOf, 1);
      }
      this.setState({ eventLog: undefined });
    } catch (error) {
      this.props.notificationHandler.danger('Unable to remove event', `Couldn't remove event ${this.eventID}`);
    }
    this.setState({ fetching: false });
  };

  get event() {
    const event = this.state.eventLog;
    if (!event) return <div className='p-2 event-log border border-terminal d-inline-block'>Event not found</div>;
    const style: React.CSSProperties = { borderColor: 'ffffff' };
    let borderClass = 'border';
    switch (event.type.toLowerCase()) {
      case 'fatal':
        style.borderColor = 'f90000';
        borderClass = 'border border-danger';
        style.backgroundColor = 'rgba(255, 0, 0, 0.50)';
        break;
      case 'error':
        borderClass = 'border border-danger';
        style.borderColor = 'af0000';
        style.backgroundColor = 'rgba(255, 0, 0, 0.15)';
        break;
      case 'warn':
        borderClass = 'border border-warn';
        style.borderColor = 'ff5a00';
        break;
      case 'info':
        style.borderColor = '72ff00';
        break;
    }
    return (
      <>
        <div className={`m-2 p-2 d-inline-block event-log ${borderClass}`} style={style}>
          <h1>{event.id}</h1>
          <div>
            <b>{event.type.toUpperCase()}</b> {moment(event.time).format('MMMM Do YYYY, HH:mm:ss')}{' '}
            {moment(event.time).fromNow()}
          </div>
          <div>{event.message}</div>
          <div>{event.error}</div>
          <div>{event.details}</div>
          <button className='btn btn-terminal btn-outline-danger btn-block' onClick={this.removeEvent}>
            Delete
          </button>
        </div>
      </>
    );
  }

  render() {
    if (this.state.fetching)
      return <ReactLoading className='m-2' type={'bars'} color={'#00ff00'} height={50} width={50} />;

    return (
      <>
        <Link className='router-link' to={`/admin/event-log`}>
          <button className='btn btn-terminal'>Back</button>
        </Link>
        <div className={`m-2 p-2 event-log`}>
          <div>{this.event}</div>
        </div>
      </>
    );
  }
}

export default withRouter(AdminEventLogItem);
