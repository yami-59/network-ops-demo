"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { ClipboardList, CalendarDays, Sparkles } from "lucide-react";

const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href}>
      <HStack
        px={3}
        py={2.5}
        borderRadius="xl"
        bg={active ? "blue.50" : "transparent"}
        border="1px solid"
        borderColor={active ? "blue.100" : "transparent"}
        w="full"
        _hover={{ bg: "blue.50" }}
        position="relative"
        spacing={3}
      >
        <Box color={active ? "blue.600" : "gray.600"}>{icon}</Box>
        <Text fontWeight={active ? "700" : "600"} color={active ? "blue.700" : "gray.700"}>
          {label}
        </Text>
        {active && (
          <Box position="absolute" left="0" top="8px" bottom="8px" w="4px" bg="blue.500" borderRadius="full" />
        )}
      </HStack>
    </Link>
  );
};

export default function Sidebar() {
  return (
    <Box
      w={{ base: "240px", md: "280px" }}
      bg="white"
      borderRight="1px solid"
      borderColor="blackAlpha.200"
      px={4}
      py={6}
      position="sticky"
      top={0}
      h="100vh"
    >
      <Text fontSize="lg" fontWeight="800" color="blue.700" mb={6}>
        Prototype Demo
      </Text>
      <VStack align="stretch" spacing={2}>
        <NavItem href="/requests" icon={<ClipboardList size={18} />} label="Demandes" />
    
        <NavItem href="/assistant" icon={<Sparkles size={18} />} label="Assistant IA" />
      </VStack>
      <Box mt={6} p={3} borderRadius="xl" bg="blue.50" border="1px solid" borderColor="blue.100">
        <Text fontSize="xs" color="blue.700" fontWeight="700">Demo</Text>
        <Text fontSize="xs" color="blue.700" mt={1}>Démo interne – Gestion simple et suivi des opérations réseau 5G.</Text>
      </Box>
    </Box>
  );
}

import React from "react";
