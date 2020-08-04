import styled from 'styled-components';

const $lypeBottomHeight = '50px';
const $lypeAnimationSpace = '60px';
const $lypeAnimationWidth = '32px';
const $lypeAnimationHeight = '25px';
const $lypeAnimationLeft = '83px';
const $lypeLoadingIconColour = '#00a323 !important';

export const Lype = styled.div`
  background-color: #232323;
  position: absolute;
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
`;


export const LypeLoadingOverlay = styled.div`
    position: absolute;
    height: 100%;
    width: 100%;
    background-color: black;
    opacity: 0.25;
    z-index: 50;
`;

export const LypeLoading = styled.div`
    width: 200px;
    height: 200px;
    font-size: 10px;
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 100;
    transform: translate(-50%, -50%);
`;

export const LypeLoadingBox = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    border: 2px solid white;
    height: 40px;
    width: 40px;
`;

// export const LypeLoadingCenter = styled.div`
//     position: absolute;
//     background-color: #00a323;
//     left: 70px;
//     top: 70px;
//     height: 60px;
//     width: 60px;
// `;

export const LypeLoadingCenter = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    left: 85px;
    top: 85px;
    height: 30px;
    width: 30px;
`;

export const LypeLoadingTop = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    left: ${$lypeAnimationLeft};
    top: ${$lypeAnimationSpace};
    border-top: 2px solid white;
    border-left: 2px solid lightgreen;
    height: ${$lypeAnimationHeight};
    width: ${$lypeAnimationWidth};
`;

export const LypeLoadingBottom = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    border-bottom: 2px solid white;
    border-right: 2px solid lightgreen;
    right: ${$lypeAnimationLeft};
    bottom: ${$lypeAnimationSpace};
    height: ${$lypeAnimationHeight};
    width: ${$lypeAnimationWidth};
`;

export const LypeLoadingLeft = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    left: ${$lypeAnimationSpace};
    top: ${$lypeAnimationLeft};
    border-left: 2px solid white;
    border-top: 2px solid lightgreen;
    height: ${$lypeAnimationWidth};
    width: ${$lypeAnimationHeight};
`;

export const LypeLoadingRight = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    border-right: 2px solid white;
    border-bottom: 2px solid lightgreen;
    right: ${$lypeAnimationSpace};
    bottom: ${$lypeAnimationLeft};
    height: ${$lypeAnimationWidth};
    width: ${$lypeAnimationHeight};
`;

export const LypeLoadingCoronerRightTop = styled.div`
      position: absolute;
      background-color: ${$lypeLoadingIconColour};
      border-right: 2px solid white;
      border-top: 2px solid white;
      right: 60px;
      top: 60px;
      height: 25px;
      width: 25px;
`;

export const LypeLoadingCoronerLeftBottom = styled.div`
    position: absolute;
    background-color: ${$lypeLoadingIconColour};
    border-bottom: 2px solid white;
    border-left: 2px solid white;
    left: 60px;
    bottom: 60px;
    height: 25px;
    width: 25px;
`;

export const LypeLoadingLSide = styled.div`
    position: absolute;
    background-color: white;
    top: 86px;
    left: 89px;
    width: 5px;
    height: 25px;
`;

export const LypeLoadingLBottom = styled.div`
    position: absolute;
    background-color: white;
    top: 110px;
    left: 89px;
    width: 20px;
    height: 5px;
`;

export const LypeWarnContent = styled.div`
    background-color: red;
    color: white;
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
`;

export const LypeWarnIgnore = styled.div`
    height: 20px;
    width: 20px;
    float: right;
    margin: 2px;
    margin-right: 5px;
    border-radius: 5px;

    &:hover {
      background-color: #ff4343;
      transform: background-color 1s;
    }
`;

export const LypeContent = styled.div`
  position: relative;
  background-color: #232323;
  color: #2d8ceb;

  height: 100%;
  width: 100%;
  display: flex;
  flex: auto;
  flex-direction: row;
`;

export const LypeLoginRequired = styled.div`
    position: absolute;
    text-align: center;
    align-items: center;

    padding: 5pt;

    box-shadow: 0 0 10pt black;

    width: 100%;
    height: 100%;
    overflow: auto;

    button {
      color: #6d6f70;
      background-color: #1d1d1d;
      border-radius: 5pt;
      padding: 5pt;
      border: none;


      &:hover {
        background-color: #2a2a2a;
      }
    }

    h1 {
      font-size: 15pt;
      color: #b9b9b9;
    }
`;

export const LypeLeftBar = styled.div`
    display: flex;
    flex-direction: column;
    width: 240px;
`;

export const LypeLeftNavbar = styled.div`
    flex: none;
    display: flex;
    flex-direction: column;
    height: 50pt;
    background-color: #363636;
`;

export const LypeLeftNavbarButtons = styled.div`
      display: flex;
      flex-direction: row;
      width: 100%;
      background-color: #262626;
      height: 20pt;
`;

export const LypeLeftNavbarButton = styled.div`
    height: 30pt;
    width: 30pt;
    padding: 2pt;
    text-align: center;
    align-items: center;

    color: #878787;
    background-color: #262626;

    &:hover {
      background-color: #2e2e2e;
    }
    .llnb-active {
        color: #e1e1e1;
        background-color: #323232;
        
        input {
        background-color: transparent;
        border: transparent;
        color: #e1e1e1;
        border-bottom: solid black 1pt;
        margin: 5pt;

        &:focus {
            outline: none;
        }
        }
    }
`;


export const LypeLeftFriends = styled.div`
    height: auto;
    flex: auto;
    overflow-y: auto;
    .empty {
        margin: 10px;
        color: #6d6f70;
    }
`;

export const LypeLeftUserInfo = styled.div`
    display: flex;
    flex-direction: row;
    flex: none;
    height: ${$lypeBottomHeight};
    background-color: #1d1d1d;
`;

export const LypeLeftUserInfoAvatar = styled.div`
      flex: none;
      align-items: center;
      text-align: center;
      margin: 5pt;

      img {
        border-radius: 5pt;
        border: 1pt solid black;
        height: 25pt;
        width: 25pt;
      }
`;
export const LaStatus = styled.div`
    display: flex;
`;

export const LypeAccountStatusBadge = styled.div`
   position: absolute;
   height: 10pt;
   width: 10pt;
   margin-left: 18pt;
   margin-top: 18pt;
   border: 1pt solid black;
   border-radius: 100%;
`;
    
export const LypeAccountStatusBadgeBig = styled.div`
   position: absolute;
   height: 12pt;
   width: 12pt;
   margin-left: 25pt;
   margin-top: 25pt;
   border: 1pt solid black;
   border-radius: 100%;
`;

export const LypeLeftUserInfoName = styled.div`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 4pt;
      width: auto;
      flex: auto;
      overflow: hidden;
`;

export const LypeluiDisplayedName = styled.div`
    text-overflow: ellipsis;
    font-weight: bold;
    color: white;
`;

export const LypeluiCustomStatus = styled.div`
    text-overflow: ellipsis;
    color: #6d6f70;
`;


export const LypeLeftUserInfoSettings = styled.div`
    width: auto;
    display: flex;
    flex: none;
    align-items: center;
    text-align: center;
`;

export const LypelusButton = styled.div`
    height: 20pt;
    width: 20pt;
    padding: 1pt;
    padding-top: 3pt;
    align-items: center;
    text-align: center;
    border-radius: 5pt;

    &:hover {
      background-color: rgba(0,0,0,0.25);
    }
`;
  


 export const LypeChat = styled.div`
    display: flex;
    flex-direction: column;
    flex: auto;
    width: auto;
 `;

 export const LypeChatHeader = styled.div`
    height: 100px;
    background-color: #272727;
    flex: none;
    border-bottom: #000000 1pt solid;
`;

 export const LypeChatContent = styled.div`
    border-top: #464646 1pt solid;
    height: auto;
    flex: auto;
    overflow: auto;
    padding: 10pt;
`;

 export const LypeChatInput = styled.div`
    display: flex;
    height: ${$lypeBottomHeight};
    padding: 5pt;
    flex: none;
    align-items: center;
    border-top: 1pt solid #161616;

    input {
      width: 100%;
      padding: 5pt;
      background-color: #161616;
      border-radius: 5pt;
      border: none;
      color: white;

      &:focus {
        outline: none;
      }
    }
`;

 export const LypeWarnMessage = styled.div`
    position: absolute;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

 export const LypeWarnTop = styled.div`
    min-height: 25px;
    color: white;
    background-color: red;
    font-weight: bold;
    text-align: center;
`;

 export const LypeWarnContent2 = styled.div`
    position: relative;
    display: block;
    height: auto;
    flex: auto;
`;

 export const LypeAccountInfoStyle = styled.div`
    margin: 2px;
    padding: 5px;
    border-radius: 2px;
   display: flex;
`;

 export const LypeAccountInfoName  = styled.div`
    word-break: break-all;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 17px;
    color: white;
    font-weight: bold;
`;
  
 export const LypeAccountInfoDetails = styled.div`
    word-break: break-all;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: gray;
    font-weight: bold;
    flex: auto;
`;
 export const LypeAccountInfoButtons = styled.div`
    display: inline-block;
`;

 export const LypeAccountInfoProfilePic = styled.div`
    display: block;
    width: 60px;
    flex: none;
    img{
      width: 50px;
      height: 50px;
    }
`;

 export const LypeAccountInfoCustom = styled.div`
    width: 100%;
    span{
      width: 100px;
    }
`;

 export const LypeAccountInfoBTN = styled.button`
    height: 20px;
    margin-left: 2px;
    padding: 0 3px;
    border: none;
    border-radius: 2px;
    float: right;
    .clickable {
        cursor: pointer;
        &:hover{
            background-color: rgba(0, 0, 0, 0.25);
        }
    }
`;

export const LypeMessages = styled.span`
    color:red
`;