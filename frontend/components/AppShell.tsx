"use client";
import { Box, Flex } from "@chakra-ui/react";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Flex minH="100vh">
      <Sidebar />
      <Box flex="1" p={{ base: 4, md: 8 }}>
        {children}
      </Box>
    </Flex>
  );
}
