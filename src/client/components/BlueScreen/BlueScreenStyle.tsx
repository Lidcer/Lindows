import styled from "styled-components";

export const BlueScreenStyle = styled.div`
  position: absolute;
  background-color: #0078d7;
  color: white;
  height: 100%;
  width: 100%;
  padding: 10px 5vw;
}
`;

export const BSOD = styled.div`
  padding-left: 20%;
  padding-right: 20%;
`;

export const BSODTitle = styled.div`
  font-size: calc(5vw + 5vh);
  padding-top: 10vh;
`;

export const BSODContent = styled.div`
  font-size: calc(1vw + 1.5vh);
  padding-top: 1vh;
`;

export const BSODwaiting = styled.div`
  font-size: calc(1vw + 1vh);
  padding-top: 5vh;
`;

export const BSODStopCode = styled.div`
  font-size: calc(1vw + 1vh);
  padding-top: 5vh;
`;
