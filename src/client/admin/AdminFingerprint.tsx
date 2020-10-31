import React, { Component } from "react";
import PropTypes from "prop-types";
import MobileDetect from "mobile-detect";
import { UAParser } from "ua-parser-js";

interface IAdminFingerprintProps {
  fingerprintData: Fingerprint2.Component[];
}

export default class AdminFingerprint extends Component<IAdminFingerprintProps> {
  get mobile() {
    const info = this.props.fingerprintData.find(e => e.key === "userAgent");
    if (info) return new MobileDetect(info.value);
    return null;
  }

  get userAgent() {
    const info = this.props.fingerprintData.find(e => e.key === "userAgent");
    if (!info) return null;
    return new UAParser(info.value);
  }

  get webdriver(): string {
    const info = this.props.fingerprintData.find(e => e.key === "webdriver");
    return info ? info.value : null;
  }

  get language(): string {
    const info = this.props.fingerprintData.find(e => e.key === "language");
    return info ? info.value : null;
  }

  get colorDepth(): number {
    const info = this.props.fingerprintData.find(e => e.key === "colorDepth");
    return info ? info.value : null;
  }

  get deviceMemory(): number {
    const info = this.props.fingerprintData.find(e => e.key === "deviceMemory");
    return info ? info.value : null;
  }

  get hardwareConcurrency(): number {
    const info = this.props.fingerprintData.find(e => e.key === "hardwareConcurrency");
    return info ? info.value : null;
  }

  get screenResolution(): [number, number] {
    const info = this.props.fingerprintData.find(e => e.key === "screenResolution");
    return info ? info.value : null;
  }

  get availableScreenResolution(): [number, number] {
    const info = this.props.fingerprintData.find(e => e.key === "screenResolution");
    return info ? info.value : null;
  }

  get timezoneOffset(): number {
    const info = this.props.fingerprintData.find(e => e.key === "timezoneOffset");
    return info ? info.value : null;
  }

  get timezone(): string {
    const info = this.props.fingerprintData.find(e => e.key === "timezone");
    return info ? info.value : null;
  }

  get sessionStorage(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "sessionStorage");
    return info ? info.value : null;
  }

  get localStorage(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "localStorage");
    return info ? info.value : null;
  }

  get indexedDb(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "indexedDb");
    return info ? info.value : null;
  }

  get addBehavior(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "addBehavior");
    return info ? info.value : null;
  }

  get openDatabase(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "openDatabase");
    return info ? info.value : null;
  }

  get cpuClass(): string {
    const info = this.props.fingerprintData.find(e => e.key === "cpuClass");
    return info ? info.value : null;
  }

  get platform(): string {
    const info = this.props.fingerprintData.find(e => e.key === "platform");
    return info ? info.value : null;
  }

  get plugins(): [string, string, string[]] {
    const info = this.props.fingerprintData.find(e => e.key === "plugins");
    return info ? info.value : null;
  }

  get canvas(): string {
    const info = this.props.fingerprintData.find(e => e.key === "canvas");
    return info ? info.value : null;
  }

  get webgl(): string[] {
    const info = this.props.fingerprintData.find(e => e.key === "webgl");
    return info ? info.value : null;
  }

  get webglVendorAndRenderer(): string {
    const info = this.props.fingerprintData.find(e => e.key === "webglVendorAndRenderer");
    return info ? info.value : null;
  }

  get adBlock(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "adBlock");
    return info ? info.value : null;
  }

  get hasLiedLanguages(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "hasLiedLanguages");
    return info ? info.value : null;
  }

  get hasLiedResolution(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "hasLiedResolution");
    return info ? info.value : null;
  }

  get hasLiedOs(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "hasLiedOs");
    return info ? info.value : null;
  }

  get hasLiedBrowser(): boolean {
    const info = this.props.fingerprintData.find(e => e.key === "hasLiedBrowser");
    return info ? info.value : null;
  }

  get touchSupport(): [number, boolean, boolean] {
    const info = this.props.fingerprintData.find(e => e.key === "touchSupport");
    return info ? info.value : null;
  }

  get fonts(): string[] {
    const info = this.props.fingerprintData.find(e => e.key === "fonts");
    return info ? info.value : null;
  }

  get audio(): string {
    const info = this.props.fingerprintData.find(e => e.key === "audio");
    return info ? info.value : null;
  }

  get renderUserAgent() {
    const device = () => {
      const model = this.userAgent.getDevice().model;
      if (!model)
        return (
          <div>
            Device: {this.userAgent.getDevice().model} {this.userAgent.getDevice().type}{" "}
            {this.userAgent.getDevice().vendor}
          </div>
        );
    };

    return (
      <div className='m-2 p-2 border border-terminal'>
        <h5>User agent:</h5>
        <div>
          Browser: {this.userAgent.getBrowser().name} ({this.userAgent.getBrowser().version})
        </div>
        <div>CPU: {this.userAgent.getCPU().architecture}</div>
        {device}
        <div>
          Engine: {this.userAgent.getEngine().name} ({this.userAgent.getEngine().version})
        </div>
        <div>
          OS: {this.userAgent.getOS().name} ({this.userAgent.getOS().version})
        </div>
      </div>
    );
  }

  get renderMobile() {
    if (!this.mobile || !this.mobile.mobile()) return;
    return (
      <div className='m-2 p-2 border border-terminal'>
        <h5>Mobile:</h5>
        <div>Mobile: {this.mobile.mobile()}</div>
        <div>OS: {this.mobile.os()}</div>
      </div>
    );
  }

  getValue(object: any) {
    switch (typeof object) {
      case "boolean":
        return <div>{object ? "true" : "false"}</div>;
      case "bigint":
      case "number":
      case "string":
        return <div>{object}</div>;
      case "undefined":
        return <div className='text-danger'>Undefined</div>;
      case "object":
        if (Array.isArray(object)) {
          return (
            <ul>
              {object.map((o, i) => {
                return <li key={i}>{o}</li>;
              })}
            </ul>
          );
        } else {
          for (const o of Object.keys(object)) {
            return this.getValue(o);
          }
        }
      default:
        return <div className='text-danger'>Unknown</div>;
    }
  }

  get renderOthers() {
    const c = this.props.fingerprintData.filter(o => o.key !== "userAgent");
    return c.map((o, i) => {
      return (
        <div key={i} className='m-2 p-2 border border-terminal'>
          <h5>{o.key}</h5>
          {this.getValue(o.value)}
        </div>
      );
    });
  }

  render() {
    return (
      <div className='m-2 border border-terminal'>
        <h1>Fingerprint data</h1>
        {this.renderUserAgent}
        {this.renderMobile}
        {this.renderOthers}
      </div>
    );
  }
}
