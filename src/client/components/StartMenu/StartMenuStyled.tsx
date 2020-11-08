import styled from "styled-components";

export const StartMenuStyled = styled.div`
  position: fixed;
  overflow: auto;
  width: 200pt;
  height: 50pt;

  background-color: black;
  background-image: url(/assets/images/noise.png);
  z-index: ${Number.MAX_SAFE_INTEGER}px;
  padding: 5pt;
`;

export const TaskBarItem = styled.div`
  margin: 1pt;
  height: 25pt;
  padding: 1pt;
  padding-left: 10pt;

  font-size: 12pt;

  color: white;

  &:hover {
    background-color: rgba(255, 255, 255, 0.75);
    border: 1pt solid rgba(255, 255, 255, 0.5);
  }

  img {
    padding: 0;
    margin: 1pt;
    width: 22pt;
    height: 22pt;
  }

  span {
    position: relative;
    left: 10pt;
    bottom: 5pt;
  }
`;
