import styled from "styled-components";

const $biosMainColour = "#0f15b3";
const $biosBackgroundColour = "#bababa";

export const BiosStyled = styled.div`
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: ${$biosBackgroundColour};
  display: flex;
  flex-direction: column;
  * {
    scrollbar-color: ${$biosBackgroundColour};
    scrollbar-width: thin;

    font-family: system !important;

    /* width */
    &::-webkit-scrollbar {
      width: 10px;
      border-radius: none;
    }

    /* Track */
    &::-webkit-scrollbar-track {
      background: ${$biosBackgroundColour};
      border-radius: none;
    }

    /* Handle */
    &::-webkit-scrollbar-thumb {
      background: ${$biosMainColour};
      border-radius: none;
    }

    /* Handle on hover */
    &::-webkit-scrollbar-thumb:hover {
      background: ${$biosMainColour};
      border-radius: none;
    }
  }
`;
export const BiosButton = styled.button`
  background-color: transparent;
  outline: none;
  border: none;
  .active {
    color: white;
    background: black;
  }
`;

export const BiosButtonActive = styled.button`
  color: white;
  background: black;
  outline: none;
  border: none;
`;

export const BiosSystemInfo = styled.div`
  color: #555555;
  display: flex;
  flex-direction: column;
  font-size: 15pt;
  font-weight: bold;

  span {
    font-size: 12pt;
    padding: 0;
    margin: 0;
  }
`;

export const BiosPopup = styled.div`
  position: absolute;
  flex: auto;
  height: auto;
  color: #ffffff;
  background: ${$biosMainColour};

  width: 300px;
  height: 200px;
  z-index: 15;
  top: 50%;
  left: 50%;
  margin: -100px 0 0 -150px;
  box-shadow: 20px 20px #000000;
`;

export const BiosPopupTitle = styled.div`
  position: absolute;
  width: 100%;
  text-align: center;

  span {
    padding: 0 5pt;
    background: ${$biosMainColour};
  }
`;

export const BiosPopupInner = styled.div`
  margin: 5pt;
  padding: 8pt;
  height: calc(100% - 10pt);
  width: calc(100% - 10pt);
  border: 1px solid ${$biosBackgroundColour};
  display: flex;
  flex-direction: column;
`;

export const BiosPopupInnerContent = styled.div`
  flex: auto;
  height: auto;
  margin-top: 8px;
`;

export const BiosPopupButtons = styled.div`
  display: flex;

  button {
    outline: none;
    flex: auto;
    width: auto;
    border: none;
    color: white;
    background-color: transparent;
  }

  .bios-active {
    background-color: black;
    background: black;
  }
`;

export const BiosTop = styled.div`
  text-align: center;
  color: ${$biosBackgroundColour};
  background-color: ${$biosMainColour};

  font-size: 20pt;
`;

export const BiosTitle = styled.div`
  color: white;
  font-size: 18pt;
  position: absolute;
  width: 100%;
  height: 25pt;
`;

export const BiosNavBar = styled.div`
  width: 100%;
  height: 25pt;
  display: flex;
  background-color: ${$biosMainColour};
  color: ${$biosBackgroundColour};
  font-weight: bold;

  .active {
    color: ${$biosMainColour};
    background-color: ${$biosBackgroundColour};
  }

  span {
    height: 100%;
    padding: 2pt;
    font-size: 15pt;
  }
`;

export const BiosGradient = styled.div`
  display: flex;
  width: 100%;

  span {
    height: 25pt;
    flex: auto;
  }

  span:empty {
    display: flex;
  }
`;

export const BiosMiddle = styled.div`
  display: flex;
  flex-direction: row;
  margin: 5pt;
  padding: 5pt;
  border: 2pt solid ${$biosMainColour};
  flex: auto;
  overflow: auto;
  color: ${$biosMainColour};
`;

export const BiosSettings = styled.div`
  padding: 5pt;
  font-size: 5pt;
  flex: auto;
  height: auto;
  font-size: 12pt;
  font-weight: bold;
`;

export const BiosSettingsLine = styled.div`
  display: flex;
  button {
    height: 5pt;
    margin-left: 5pt;
    background-color: transparent;
    border: none;
  }
`;

export const BiosInfo = styled.div`
  border-left: 2px solid ${$biosMainColour};
  padding: 5pt;
  color: ${$biosMainColour};
  max-width: 200pt;
  display: flex;
  flex-direction: column;
`;

export const BiosTopInfo = styled.div`
  flex: auto;
  height: 100%;
`;

export const BiosBottomInfo = styled.div`
  border-top: 1pt solid;
`;

export const BiosBottom = styled.div`
  text-align: center;
  color: white;
  background-color: ${$biosMainColour};
  font-size: 15pt;

  button {
    background: none;
    border: none;
  }
`;

export const TermsAndPolicyContainer = styled.div`
  overflow: auto;
  padding: 5px;

  p,
  ul {
    color: #555555;
  }
`;
