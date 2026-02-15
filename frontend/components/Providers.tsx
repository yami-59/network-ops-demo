"use client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      body: { background: "#F7FAFF" }
    }
  },
  components: {
    Card: {
      baseStyle: { container: { boxShadow: "0 10px 30px rgba(15,23,42,0.06)", border: "1px solid rgba(15,23,42,0.08)" } }
    }
  }
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
