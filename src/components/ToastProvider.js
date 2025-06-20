'use client';

import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';

export function ToastProvider() {
  useEffect(() => {
    console.log('ToastProvider mounted');
  }, []);

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      style={{
        fontSize: '24px',
        zIndex: 9999
      }}
    />
  );
}
