import styled from 'styled-components';

export const WebExplorerWarper = styled.div`
  width: 100%;
  height: 100%;
  background-color: white;
  position: relative;
  overflow: hidden;
`;

export const BrowserUrl = styled.div`
  width: calc(100% - 100px);
  padding: 1px;
  margin-left: 20px;
  float: right;
  display: inline-block;
  border: 1px solid black;
  position: absolute;
  top: 15px;
`;

export const Reload = styled.button`
  border: none;
  float: right;
  &:focus {
    outline: none;
  }
`;

export const BrowserUrlInput = styled.input`
  width: calc(100% - 50px);
  border: none;
  outline: none;
  &:focus {
    outline: none;
  }
`;

export const Frame = styled.iframe`
  width: 100%;
  height: calc(100% - 50px);
  overflow: hidden;
  border: none;
`;

export const BackButton = styled.button`
  width: 50px;
  height: 50px;
  border: none;
  background-color: #0284c3;
  border-radius: 100%;
  color: white;
  font-size: 20px;
  :disabled {
    background-color: white;
    color: black;
    border: 1px solid black;
  }
  &:focus {
    outline: none;
  }
`;

export const ForwardButton = styled.button`
  width: 25px;
  height: 25px;
  border: none;
  font-size: 10px;
  border-radius: 100%;
  background-color: #0284c3;
  color: white;

  :disabled {
    background-color: white;
    color: black;
    border: 1px solid black;
  }
  &:focus {
    outline: none;
  }
`;

export const RefreshButton = styled.button`
  width: 25px;
  height: 25px;
  border: none;
  border-radius: 100%;
  &:focus {
    outline: none;
  }
`;
