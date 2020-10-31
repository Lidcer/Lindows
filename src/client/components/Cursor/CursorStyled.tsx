import styled from 'styled-components';

export const CursorStyle = styled.img`
  pointer-events: none;
  position: fixed;
  z-index: 9999999999999;
  height: 60px;
  width: 60px;

  transform: translateX(25px);
`;
