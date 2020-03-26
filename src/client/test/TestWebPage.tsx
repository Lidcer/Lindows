import React from 'react';

export class TestWebPage extends React.Component {
  render() {
    return (
      <div className='container d-block p-5'>
        <ul>
          <li>
            <a href='account'>Account</a>
          </li>
          <li>
            <a href='lype'>Lype</a>
          </li>
          <li>
            <a href='appTester'>appTester</a>
          </li>
        </ul>
      </div>
    );
  }
}
