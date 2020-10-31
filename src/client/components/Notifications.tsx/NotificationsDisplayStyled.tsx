import styled from 'styled-components';

export const NotificationOverlay = styled.div`
  position: fixed;
  display: flex;
  flex-direction: column-reverse;
  height: 90%;
  width: 400px;
  pointer-events: none;
  right: 20px;
  top: 5%;
`;

export const NotificationToast = styled.div`
  margin: 5px 0;
  height: 100px;
  width: 370px;
  background-color: black;
  color: white;
  background-image: url(/assets/images/noise.png);
  display: flex;
  pointer-events: all;
  transition: margin 1s;
  flex: none;

  &:hover {
    .notification-buttons {
      display: block !important;
    }
  }

  .notification-animated {
    margin: 5px 400px;
  }
`;

export const NotificationImage = styled.div`
  padding: 5px;
  margin: 5px;
  flex: none;
  img {
    max-width: 90px;
    max-height: 90px;
  }
`;

export const NotificationContent = styled.div`
  width: auto;
  flex: auto;
  word-break: break-all;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin: 5px;

  h1 {
    font-size: 25px;
  }

  h5 {
    font-size: 20px;
  }

  p {
    color: #cbcbcb;
  }
`;

export const NotificationButtons = styled.div`
  flex: none;
  width: 20px;
  margin: 5px;
  font-size: 20px;
  display: none; ;
`;
