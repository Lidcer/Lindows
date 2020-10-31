import styled from 'styled-components';

export const BootScreenStyled = styled.div`
  position: absolute;
  padding: 5pt;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: black;
  color: white;
  font-size: 12pt;
`;

export const BootScreenLogo = styled.div`
  background-color: red;
  top: 0;
  right: 0;
  width: 20%;
`;

export const BootScreenInfo = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const BootScreenTop = styled.div`
  display: flex;
  width: 100%;
  height: 20%;

  .info {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  span {
    display: inline-block;
  }

  img {
    right: 0;
    height: 100%;
  }
`;

export const BootScreenMiddle = styled.div`
  width: 100%;
  height: auto;
  flex: auto;
`;

export const BootScreenBottom = styled.div`
  display: flex;
  flex-direction: column-reverse;
  width: 100%;
  height: 10%;
`;
