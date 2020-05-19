import React, { Component } from 'react';
import { TOKEN_HEADER } from '../../shared/constants';
import Axios, { AxiosRequestConfig } from 'axios';
import { IResponse } from '../../shared/ApiUsersRequestsResponds';
import Navigation from './AdminNavigation';
import moment from 'moment';
import { IAdminWebSocket } from './Websocket';
import { Link } from 'react-router-dom';
import ReactLoading from 'react-loading';

export interface IEventLog {
  id: string;
  type: string;
  time: string;
  message?: string;
  details?: string[];
  error?: string;
}

type ButtonTypes = 'none' | 'fatal' | 'error' | 'warn' | 'info' | 'log';
interface IAdminEventLogState {
  warn: string;
  refreshing: boolean;
  page: number;
  eventLogs: IEventLog[];
  search: string;
  buttonEnabled: ButtonTypes;
}

interface IAdminEventLogProps {
  adminWebSocket: IAdminWebSocket;
}

interface IEventLogData {
  eventLogs: IEventLog[];
  date: Date;
}

export let eventLogData: IEventLogData = {
  eventLogs: [],
  date: new Date(),
};

export class AdminEventLogList extends Component<IAdminEventLogProps, IAdminEventLogState> {
  constructor(props) {
    super(props);
    this.state = {
      eventLogs: eventLogData.eventLogs,
      page: 0,
      warn: '',
      refreshing: false,
      search: '',
      buttonEnabled: 'none',
    };
  }
  componentDidMount() {
    if (!eventLogData.eventLogs.length) this.getInfo();
    this.props.adminWebSocket.on('event-log', this.addEventLogFromSocket);
    this.setState({ eventLogs: eventLogData.eventLogs });
  }

  componentWillUnmount() {
    this.props.adminWebSocket.removeListener('event-log', this.addEventLogFromSocket);
  }

  addEventLogFromSocket = (eventLog: IEventLog) => {
    if (!eventLog) {
      this.getInfo();
      return;
    }
    const find = eventLogData.eventLogs.find(el => el.id === eventLog.id);
    if (!find) {
      eventLogData.eventLogs.push(eventLog);
      this.setState({ eventLogs: eventLogData.eventLogs });
    }
  };

  async getInfo() {
    this.setState({ refreshing: true });
    const token = localStorage.getItem('auth');
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.get<IResponse<IEventLog[]>>('/api/v1/admin/event-logs', axiosRequestConfig);
      let eventLogs = response.data.success;
      if (!eventLogs) throw new Error('Missing data');
      eventLogs = eventLogs.sort((a, b) => new Date(b.time).getMilliseconds() - new Date(a.time).getTime());
      eventLogData = { eventLogs, date: new Date() };
      setTimeout(() => {
        this.updateList();
      });
    } catch (error) {
      console.error(error);
      this.setState({ warn: 'Unable to fetch data' });
    }
    this.setState({ warn: '', refreshing: false });
  }

  get refreshButton() {
    return (
      <button className='btn btn-terminal' onClick={() => this.getInfo()}>
        Refresh
      </button>
    );
  }

  get warn() {
    const width = { width: '250px' };
    if (this.state.refreshing) {
      return (
        <div className='text-info' style={width}>
          Refreshing
        </div>
      );
    }

    if (!eventLogData) {
      return (
        <div className='text-danger' style={width}>
          Unable to get data
        </div>
      );
    }
    if (!this.state.warn) return null;
    return (
      <div className='text-danger' style={width}>
        {this.state.warn}
      </div>
    );
  }

  getEvent(event: IEventLog) {
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
      <Link className='router-link' to={`/admin/event-log/${event.id}`} style={{ textDecoration: 'none' }}>
        <div className={`m-2 p-2 event-log admin-clickable ${borderClass}`} style={style}>
          <div>
            <b>{event.type.toUpperCase()}</b>
            {moment(event.time).format('MMMM Do YYYY, HH:mm:ss')} {moment(event.time).fromNow()}
          </div>
          <div>{event.message}</div>
          <div>{event.error}</div>
          <div>{event.details}</div>
        </div>
      </Link>
    );
  }

  eventPage() {
    const multiplayer = this.state.page !== 0 ? 10 * this.state.page : 0;
    const events = this.state.eventLogs.slice(0 + multiplayer, 10 + multiplayer);
    if (!events.length && this.state.page !== 0) {
      this.setState({ page: 0 });
      return null;
    }
    if (!events.length)
      return (
        <div>
          <div className='p-2 event-log border border-terminal d-inline-block'>No events found</div>
        </div>
      );
    return events.map((e, i) => {
      return <div key={i}> {this.getEvent(e)} </div>;
    });
  }

  updateList() {
    let eventLogs = eventLogData.eventLogs;
    if (this.state.buttonEnabled !== 'none') {
      eventLogs = eventLogs.filter(e => e.type === this.state.buttonEnabled);
    }
    if (this.state.search) {
      eventLogs = eventLogs
        .filter(e => {
          const message = e.message;
          const details = e.details || '';
          const error = e.error || '';
          const msg = `${message}${details}${error}`;
          return msg.toLowerCase().includes(this.state.search.toLowerCase());
        })
        .sort((a, b) => new Date(b.time).getMilliseconds() - new Date(a.time).getTime());
    }

    this.setState({ eventLogs });
  }

  render() {
    if (this.state.refreshing) {
      return <ReactLoading className='m-2' type={'bars'} color={'#00ff00'} height={50} width={50} />;
    }

    if (!eventLogData) {
      return (
        <div className='m-2'>
          {this.refreshButton}
          {this.warn}
        </div>
      );
    }

    const btnC = (btn: ButtonTypes) => {
      return this.state.buttonEnabled === btn ? ' selected' : '';
    };

    const cl = (btn: ButtonTypes) => {
      if (this.state.buttonEnabled === btn) {
        this.setState({ buttonEnabled: 'none' });
      } else {
        this.setState({ buttonEnabled: btn });
      }
      setTimeout(() => {
        this.updateList();
      });
    };

    const c = (ev: React.ChangeEvent<HTMLInputElement>) => {
      this.setState({ search: ev.target.value });
    };

    const key = (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === 'Enter') {
        setTimeout(() => {
          this.updateList();
        });
      }
    };

    const time = eventLogData.date ? (
      <span className='p-2'> {moment(eventLogData.date).format('MMMM Do YYYY, HH:mm:ss')}</span>
    ) : null;

    return (
      <div className='m-2'>
        {this.refreshButton}
        {time}
        <div>
          <input
            type='text'
            className='input-terminal'
            value={this.state.search}
            onChange={c}
            placeholder='Search'
            onKeyDown={key}
          />
          <button className={`btn btn-sm btn-terminal${btnC('fatal')}`} onClick={e => cl('fatal')}>
            Fatal
          </button>
          <button className={`btn btn-sm btn-terminal${btnC('error')}`} onClick={e => cl('error')}>
            Error
          </button>
          <button className={`btn btn-sm btn-terminal${btnC('warn')}`} onClick={e => cl('warn')}>
            Warn
          </button>
          <button className={`btn btn-sm btn-terminal${btnC('info')}`} onClick={e => cl('info')}>
            Info
          </button>
          <button className={`btn btn-sm btn-terminal${btnC('log')}`} onClick={e => cl('log')}>
            Log
          </button>
          {this.eventPage()}
          <Navigation
            length={this.state.eventLogs.length}
            currentPage={this.state.page}
            onNext={() => {
              this.setState({ page: this.state.page + 1 });
            }}
            onPrevious={() => {
              this.setState({ page: this.state.page - 1 });
            }}
          />
        </div>
      </div>
    );
  }
}
