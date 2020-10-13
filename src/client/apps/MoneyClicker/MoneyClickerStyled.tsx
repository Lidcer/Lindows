import styled from 'styled-components';

export const MoneyClickerWarper = styled.div`
  position: absolute;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background-color: black;
`;

export const MoneyClickerSettings = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  text-align: left;
`;

export const MoneyClickerMenuButtons = styled.div`
  margin: 0;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export const MenuButton = styled.div`
  outline: none;
  border: none;
  font-size: 20pt;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.75);
  padding: 5px;
  margin: 5px;
  border: 2px solid rgba(0, 0, 128, 0.5);
  border-radius: 5px;

  &:hover {
    background-color: rgba(64, 64, 64, 0.75);
    border: 2px solid rgba(64, 64, 255, 0.5);
  }
  transition: background-color 0.25s, border 0.25s;
`;
