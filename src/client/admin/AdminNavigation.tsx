import React, { Component } from "react";
import PropTypes from "prop-types";

interface INavigationProps {
  length: number;
  currentPage: number;
  onNext: () => void;
  onPrevious: () => void;
}

export default class AdminNavigation extends Component<INavigationProps> {
  render() {
    const pages = Math.floor(this.props.length / 10);
    if (!pages) return null;
    return (
      <div className='d-inline-block border-terminal'>
        <button
          className='d-inline btn btn-terminal'
          onClick={() => this.props.onPrevious()}
          disabled={this.props.currentPage <= 0}
        >
          --
        </button>
        <div className='d-inline'>
          {this.props.currentPage} / {pages - 1}
        </div>
        <button
          className='d-inline btn btn-terminal'
          onClick={() => this.props.onNext()}
          disabled={this.props.currentPage > pages - 1}
        >
          ++
        </button>
      </div>
    );
  }
}
