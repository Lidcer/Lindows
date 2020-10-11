import React from 'react';
import { allApps } from '../essential/apps';

export class TestWebPage extends React.Component {
  get links() {
    return allApps.map((a, i) => {
      return (
        <li key={i}>
          <div
            className='border border-secondary rounded-5 bg-dark p-1'
            onClick={() => {
              location.href = `app-tester/${a.manifest.launchName}`;
            }}
            style={{ cursor: 'pointer' }}
          >
            <a className='text-info pl-2' href={`app-tester/${a.manifest.launchName}`}>
              <img className='text-info mr-2' src={a.manifest.icon} height='25' />
              {a.manifest.fullAppName}
            </a>
          </div>
        </li>
      );
    });
  }

  render() {
    return (
      <div className='container d-block p-5'>
        <ul>{this.links}</ul>
      </div>
    );
  }
}
