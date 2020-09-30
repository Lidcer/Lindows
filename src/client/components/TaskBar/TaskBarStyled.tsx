import styled from 'styled-components';
import { alwaysOnTop } from './../../Constants';
export const zIndex = alwaysOnTop;

export const Aero = styled.div`
  width: 100%;
  height: 100%;
  filter: blur(6px);
  backdrop-filter: blur(6px);
  z-index: ${zIndex - 20} !important;

`;

export const hover = `
  transition: background-color 0.05s ease-out;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transition: background-color 0.05s ease-out;
  }

`

export const TaskbarStyled = styled.div`
  color: white;
  opacity: 100;
  user-select: none;
  overflow: hidden;
  position: absolute;
  z-index: ${zIndex - 10} !important;
`;

export const TaskBarBackground = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: ${zIndex - 10} !important;
  opacity: 0.9;
  background-color: black;
  background-color: rgba(255, 255, 255, 0.5);
  background-image: url(/assets/images/noise.png);
  `;

export const TaskBarBottom = styled.div`
  position: absolute;
  color: white;
  z-index: ${zIndex - 10} !important;
  bottom: 0;
  width: 100%;
  height: 30pt;
`;

export const TaskBarTop = styled.div`
  position: absolute;
  color: white;
  z-index: ${zIndex - 10} !important;
  top: 0;
  width: 100%;
  height: 30pt;
  `;

export const TaskBarLeft = styled.div`
  position: absolute;
  color: white;
  z-index: ${zIndex - 10} !important;
  height: 100%;
  width: 50pt;
  `;

export const TaskBarRight = styled.div`
  position: absolute;
  color: white;
  height: 100%;
  right: 0;
  width: 50pt;
`;

export const TaskBarGridHor = styled.div`
  display: grid;
  grid-template-columns: repeat(2, min-content) auto repeat(5, min-content);
  grid-template-rows: 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  height: 40px;
  overflow:hidden;
`;

export const TaskBarGridVer = styled.div`
  display: grid;
  grid-template-rows: repeat(2, min-content) auto repeat(5, min-content);
  grid-template-columns: 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  width: 30px;
  overflow:hidden;
`;


export const TaskBarClockHor = styled.div`
  ${hover}

  font-size: 10pt;
  text-align: center;
  width: auto;
  height: auto;
  padding: 0 4pt;
`;

export const TaskBarClockVer = styled.div`
  ${hover}

  font-size: 8pt;

  text-align: center;
  width: 100%;
  padding: 0;
`;

export const TaskBarShowDesktopHor = styled.div`
  ${hover}

  width: 5pt;
  height: 100%;
  border-left: 1px solid rgba($color: #ffffff, $alpha: 0.25);
`;

export const TaskBarShowDesktopVer = styled.div`
  ${hover}

  height: 5pt;
  width: 100%;
  border-top: 1px solid rgba($color: #ffffff, $alpha: 0.25);
`;

export const TaskBarStartBtnVer = styled.div`
  ${hover}
  padding: 5pt;


  text-align: center;

  img {
    height: 20pt;
  }
`;

export const TaskBarStartBtnHor = styled.div`
  ${hover}
  text-align: center;
  padding: 5pt;

  img {
    height: 20pt;
  }
`;

export const TaskBarNotificationHor = styled.div`
  padding: 8pt;
  font-size: 15pt;
`;

export const TaskBarNotificationVer = styled.div`
  ${hover}
  padding: 5pt 0;
  align-items: center;
  align-content: center;
  text-align: center;
  width: 100%;
  font-size: 12pt;
`;

export const TaskBarOpenIcons = styled.div`
  height: 28pt;
  width: 30pt;
  padding-left: 7pt;
  margin: 0;
  align-items: center;
  align-self: auto;

  display: inline-flex;

  border-bottom: 1pt solid #76b9ed;

  &:hover {
    background-color: rgba(255, 255, 255, 0.75);
  }
`;

export const TaskBarOpenIconActive = styled.div`
  background-color: rgba(255, 255, 255, 0.75);
`;

export const TaskBarIcon = styled.img`
  height: 20pt;
  width: 20pt;
  padding: 0;
  margin: 0;
`;

export const TaskBarExtended = styled.div`
  position: relative;
  height: 100%;
  width: 2pt;
  right: -7pt;

  &:hover {
    border-left: 1px solid #202123;
  }
`;
