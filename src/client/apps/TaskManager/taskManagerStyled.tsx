import styled from 'styled-components';

export const TaskManagerStyle = styled.div`
  background-color: white;
  color: black;
  height: 100%;
  width: 100%;

  tr {
    width: 100%;

    &:hover {
      background-color: transparentize($color: #000000, $amount: 0.85);
    }
  }

  th {
    width: 100%;
    padding-top: 12px;
    padding-bottom: 12px;
    text-align: left;
    border-right: 1pt solid gray;
    border-bottom: 1pt solid darkslategray;
    color: black;
  }

  button {
    position: absolute;
    padding: 2pt;
    margin: 2pt;
    right: 0;
    bottom: 0;
  }
`;

export const TaskManagerSelected = styled.div`
  background-color: rgba(255, 255, 225, 0.85);
`;
