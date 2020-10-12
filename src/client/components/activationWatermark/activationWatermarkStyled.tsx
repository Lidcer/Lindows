import styled from 'styled-components';

export const ActivationWatermarkStyle = styled.div`
  position: fixed;
  bottom: 35pt;
  right: 5pt;
  z-index: 999999999999;
  color: white;
  opacity: 0.9;
  width: 275pt;

  pointer-events: none;

  h1 {
    font-size: 15pt;
  }

  h2 {
    font-size: 12pt;
  }
`;
