import styled from 'styled-components';

export const TerminalStyled = styled.div`
  background-color: rgba(0, 0, 0, 0.9);
  height: 100%;
  width: 100%;
  position: absolute;
  display: block;
  overflow: auto;
  font-size: 15px;
  font-family: monospace;
`;
export const TerminalContent = styled.span`
  display: flex;
  flex-direction: column;
`;

export const TerminalName = styled.span`
  color: red;
`;
export const TerminalInput = styled.span`
  background-color: transparent;
  // border: none;
  left: 0;
  right: 0;
  color: white;
  size: auto;
  white-space: pre;
`;

export const TerminalCommandContent = styled.span`
  white-space: pre;
`;

export const TerminalBlinkingCursor = styled.span`
  color: white;
  animation: 1s terminal-blink step-end infinite;
  position: absolute;
  margin-left: -2px;
  @keyframes terminal-blink {
    from,
    to {
      color: transparent;
    }

    50% {
      color: white;
    }
  }
`;

export const TerminalLine = styled.span``;
