import styled from 'styled-components';

export const VirtualCrateWarper = styled.div`
  width: 100%;
  height: 100%;
  background-color: rgba(32, 32, 32, 1);
`;

export const OSSelections = styled.div`
  width: 50%;
  height: calc(100% - 10px);
  border-right: 1px solid white;
  display: inline-block;
  margin: 5px;
  padding: 5px;
`;

export const OSSelection = styled.div`
  width: calc(100% - 10px);
  border: 1px solid white;
  margin: 5px;
  padding: 5px;
  transition: background-color 0.25s;
  &:hover {
    background-color: gray;
  }
`;

export const OSSelected = styled.div`
  width: calc(100% - 10px);
  border: 1px solid white;
  margin: 5px;
  padding: 5px;
  background-color: lightblue;
`;

export const OsDetails = styled.div`
  display: inline-block;
  height: 100%;
`;

export const OptionButton = styled.div`
  text-align: center;
  display: inline-block;
  border: none;
  font-size: 25px;
  transition: color 0.25s;
  margin: 0px 5px;
  &:hover {
    color: white !important;
  }
`;

export const OptionCaption = styled.div`
  font-size: 10px;
`;

export const BrowserUrl = styled.input`
  width: 50%;
`;

export const Frame = styled.iframe`
  width: 100%;
  height: 100%;
`;
