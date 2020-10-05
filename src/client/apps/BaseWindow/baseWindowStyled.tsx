import styled from 'styled-components';

const $resizeBorderThickens = '5pt';
const $debugColorSide = 'none'; // yellow;
const $debugColorCorner = 'none'; // orange;
const $titleBarHeight = '20pt';
const $zIndex = '50';
const $scrollbarBG = 'rgb(0, 0, 0)';
const $thumbBG = 'rgb(48, 50, 51)';

export const LWindow = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;

  background-color: transparent;
  color: white;
  z-index: 5;
  border: 1px solid #2b4248;
  box-shadow: 3px 3px 10px 5px rgba(0, 0, 0, 0.25);

  h1 {
    padding: 4pt;
    font-size: 10pt;
  }
`;

export const LWindowContent = styled.div`
  position: relative;
  height: 100%;
  flex: auto;
  width: 100%;
  display: block;
  background-color: transparent;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 11px;
  }

  scrollbar-width: thin;
  scrollbar-color: ${$thumbBG} ${$scrollbarBG};

  &::-webkit-scrollbar-track {
    background: ${$scrollbarBG};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${$thumbBG};
    border-radius: 6px;
    border: 3px solid ${$scrollbarBG};
  }
`;

export const LWindowUpHover = styled.div`
  position: absolute;
  width: 100%;
  height: ${$resizeBorderThickens};
  top: -2px;
  left: 0;
  background-color: ${$debugColorSide};
  cursor: n-resize;
  z-index: ${$zIndex};
`;

export const LWindowBottomHover = styled.div`
  position: absolute;
  width: 100%;
  height: ${$resizeBorderThickens};
  bottom: -2px;
  left: 0;
  background-color: ${$debugColorSide};
  cursor: s-resize;
  z-index: ${$zIndex};
`;

export const LWindowLeftHover = styled.div`
  position: absolute;
  width: ${$resizeBorderThickens};
  height: 100%;
  bottom: 0;
  left: -2px;
  background-color: ${$debugColorSide};
  cursor: w-resize;
  z-index: ${$zIndex};
`;

export const LWindowRightHover = styled.div`
  position: absolute;
  width: ${$resizeBorderThickens};
  height: 100%;
  bottom: 0;
  right: -2px;
  background-color: ${$debugColorSide};
  cursor: e-resize;
  z-index: ${$zIndex};
`;

export const LWindowUpLeftHover = styled.div`
  position: absolute;
  width: ${$resizeBorderThickens};
  height: ${$resizeBorderThickens};
  top: 0;
  left: 0;
  background-color: ${$debugColorCorner};
  cursor: nw-resize;
  z-index: ${$zIndex};
`;

export const LWindowUpRightHover = styled.div`
  position: absolute;
  width: ${$resizeBorderThickens};
  height: ${$resizeBorderThickens};
  top: 0;
  right: 0;
  background-color: ${$debugColorCorner};
  cursor: ne-resize;
  z-index: ${$zIndex};
`;

export const LWindowBottomLeftHover = styled.div`
  position: absolute;
  width: ${$resizeBorderThickens};
  height: ${$resizeBorderThickens};
  bottom: 0;
  left: 0;
  background-color: ${$debugColorCorner};
  cursor: sw-resize;
  z-index: ${$zIndex};
`;

export const LWindowBottomRightHover = styled.div`
  position: absolute;
  width: ${$resizeBorderThickens};
  height: ${$resizeBorderThickens};
  bottom: 0;
  right: 0;
  background-color: ${$debugColorCorner};
  cursor: se-resize;
  z-index: ${$zIndex};
`;

//also modify navbar

const buttons = `
  padding: 5pt;
  display: inline-block;
`;

export const TitleBar = styled.div`
  height: ${$titleBarHeight};
  width: 100%;
  flex: none;
`;

export const TitleBarInactive = styled.div`
  background-color: rgba(255, 255, 255, 0.25);
`;

export const TitleBarIcon = styled.img`
  position: absolute;
  margin: 2pt;
  top: 0;
  left: 0;
  height: 15pt;
  width: 15pt;
`;

export const TitleBarTitle = styled.div`
  position: absolute;
  left: 5pt;
  top: 4pt;
  width: calc(100% - 60pt);
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const TitleBarTitleWithIcon = styled.span`
  position: absolute;
  left: 20pt;
  top: 4pt;
  width: calc(100% - 80pt);
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const TitleBarRight = styled.div`
  height: ${$titleBarHeight};
  position: absolute;
  top: 0;
  right: 0;
`;

export const TitleBarExit = styled.div`
  ${buttons}
  &:hover {
    background-color: red;
    transition: background-color 0.05s ease-out;
  }
`;

export const TitleBarButtonHover = styled.div`
  ${buttons}
  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
    transition: background-color 0.05s ease-out;
  }
`;

export const TitleBarButtonDisabled = styled.span`
  ${buttons}
  color: #535353;
`;

export const MsgBoxWarper = styled.div`
  height: 100%;
  width: 100%;
  background-color: rgba(16, 16, 16, 1);
  overflow: auto;
`;

export const MsgBoxContent = styled.div`
  display: inline-flex;
  width: 100%;
  white-space: pre;
`;

export const MsgBoxCaption = styled.p`
  color: white;
  padding: 5px;
  margin-top: 5px;
  display: inline-block;
`;

export const MsgBoxIcon = styled.img`
  width: 100px;
  flex: none;
  padding: 5px;
  display: inline-block;
`;

export const MsgBoxButton = styled.button`
  width: 50px;
  padding: 5px;
  border: none;
`;

export const MsgBoxButtons = styled.div`
  width: 100%;
  background-color: rgba(16, 16, 16, 1);
  position: absolute;
  text-align: center;
  align-items: center;
`;

export const Blocker = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 99999;
`;

export const UserAdminStyled = styled.div`
  width: 100%;
  height: 100%;
  background-color: white;
`;

export const UserAdminTop = styled.div`
  position: relative;
  background-color: #76b9ed;
  color: black !important;
  width: 100%;
  height: auto;
`;

export const UserAdminContent = styled.div`
  font-size: 20px;
  margin: 15px;
  font-weight: bold;
`;

export const UserAdminMiddle = styled.div`
  display: block;
  margin: 15px;
  display: block;
  img {
    max-width: 50px;
    max-height: 50px;
  }
  div {
    display: inline;
    font-size: 20px;
  }
`;

export const UserAdminBottom = styled.div`
  width: 100%;
  display: inline-block;
  margin-top: 140px;
  button {
    background-color: #b8b8b8;
    border: none;
    margin: 0 5%;
    font-size: 20px;
    width: 40%;
  }
`;
