import styled from "styled-components";

export const LindowsWarper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: black;
  color: white;
`;

export const LindowsLogo = styled.div`
  img {
    width: 25%;
    display: block;
    margin-top: 25px;
    margin-left: auto;
    margin-right: auto;
  }
`;
export const LindowsLoadingBar = styled.div`
  .loading-box {
    display: block;
    width: 10%;
    height: 25px;
    border: 1px solid white;
    border-radius: 5px;
    margin-left: auto;
    margin-right: auto;
    overflow: hidden;
  }
  .loading-animator {
    display: inline-block;
    height: 100%;
    width: 100%;
    position: relative;
    left: -45px;
  }

  span {
    display: inline-block;
    width: 15px;
    height: 100%;
    padding-right: 1px;
    margin-right: 2px;
    background: rgb(48, 64, 200);
    background: linear-gradient(0deg, rgba(48, 64, 200, 1) 0%, rgba(136, 161, 253, 1) 47%, rgba(45, 60, 189, 1) 100%);
    border-left: 2px solid #273396;
    border-top: 2px solid #273396;
    border-radius: 2px;
  }
`;
export const LindowsWatermarks = styled.div`
  position: absolute;
  bottom: 0px;
  right: 0px;
  padding: 5px;
`;
