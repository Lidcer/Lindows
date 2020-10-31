import React, { Component } from "react";
import PropTypes from "prop-types";
import Axios, { AxiosRequestConfig } from "axios";
import { TOKEN_HEADER } from "../../shared/constants";
import { IResponse } from "../../shared/ApiUsersRequestsResponds";
import { CpuInfo, UserInfo } from "os";
import * as pretty from "prettysize";
import ReactLoading from "react-loading";
import moment from "moment";

interface IServerInfo {
  memoryUsage: NodeJS.MemoryUsage;
  version: string;
  arch: string;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  os: {
    cpus: CpuInfo[];
    userInfo: UserInfo<string>;
    platform: string;
    release: string;
    totalmem: number;
    uptime: number;
    disks: IDisk[];
  };
}

interface IDisk {
  available: number;
  blocks: number;
  capacity: string;
  filesystem: string;
  mounted: string;
  used: number;
}

interface IServerInfoData extends IServerInfo {
  date: Date;
}

let data: IServerInfoData;

interface IAdminState {
  refreshing: boolean;
}

export default class AdminHome extends Component<{}, IAdminState> {
  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  componentDidMount() {
    if (!data) this.getInfo();
  }

  async getInfo() {
    this.setState({ refreshing: true });
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.get<IResponse<IServerInfo>>("/api/v1/admin/server-info", axiosRequestConfig);
      const serverInfo = response.data.success;
      if (!serverInfo) throw new Error("Missing data");
      data = { ...serverInfo, date: new Date() };
    } catch (error) {
      console.error(error);
    }
    this.setState({ refreshing: false });
  }

  get refreshButton() {
    return (
      <button className='btn btn-terminal' onClick={() => this.getInfo()}>
        Refresh
      </button>
    );
  }

  render() {
    if (this.state.refreshing) {
      return <ReactLoading className='m-2' type={"bars"} color={"#00ff00"} height={50} width={50} />;
    }

    if (!data) {
      return <div className='m-2'>{this.refreshButton}</div>;
    }

    return (
      <div className='m-2'>
        {this.refreshButton}
        <div className='m-2 p-2 border border-terminal'>
          <div>Arch: {data?.arch}</div>
          <div>
            CPU Usage
            <ul>
              <li>User: {data?.cpuUsage?.user}</li>
              <li>System: {data?.cpuUsage?.system}</li>
            </ul>
          </div>
          <div>
            Memory Usage
            <ul>
              <li>External: {pretty(data?.memoryUsage?.external)}</li>
              <li>HeapTotal: {pretty(data?.memoryUsage?.heapTotal)}</li>
              <li>HeapUsed: {pretty(data?.memoryUsage?.heapUsed)}</li>
              <li>Rss: {pretty(data?.memoryUsage?.rss)}</li>
            </ul>
          </div>
          <div>Uptime: {moment(Date.now() - data.uptime * 1000).fromNow(true)}</div>
          <div>Node version: {data?.version}</div>
        </div>

        <div className='m-2 p-2 border border-terminal'>
          <div>
            <b>Operation System</b>
          </div>
          <div>Platform: {data.os.platform}</div>
          <div>Release: {data.os.release}</div>
          <div>Total memory: {pretty(data.os.totalmem)}</div>
          <div>Uptime: {moment(Date.now() - data.os.uptime * 1000).fromNow(true)}</div>
          <div>
            User info:
            <ul>
              <li>username: {data.os.userInfo.username}</li>
              <li>Homedir: {data.os.userInfo.homedir}</li>
              <li>Shell: {data.os.userInfo.shell}</li>
              <li>GID: {data.os.userInfo.gid}</li>
              <li>UID: {data.os.userInfo.uid}</li>
            </ul>
          </div>
          <div className='border border-terminal'>
            <div className='m-2'>Drives({data.os.disks.length}):</div>
            <div>
              <ul>
                {data.os.disks.map((e, i) => {
                  return (
                    <div className='card-body' style={{ display: "inline-block" }} key={i}>
                      <div>
                        <ul>
                          <li>filesystem: {e.filesystem}</li>
                          <li>mounted: {e.mounted}</li>
                          <li>capacity: {e.capacity}</li>
                          <li>available: {pretty(e.available)}</li>
                          <li>blocks: {pretty(e.blocks)}</li>
                          <li>used: {pretty(e.used)}</li>
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className='border border-terminal'>
            <div className='m-2'>CPUS({data.os.cpus.length}):</div>
            <div>
              <ul>
                {data.os.cpus.map((e, i) => {
                  return (
                    <div className='card-body' style={{ display: "inline-block" }} key={i}>
                      <span>{e.model}</span>
                      <div>
                        <ul>
                          <li>speed: {e.speed}</li>
                          <li>sys: {e.times.sys}</li>
                          <li>user: {e.times.user}</li>
                          <li>nice: {e.times.nice}</li>
                          <li>irq: {e.times.irq}</li>
                          <li>idle: {e.times.idle}</li>
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
