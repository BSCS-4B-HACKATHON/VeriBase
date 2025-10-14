"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Wallet } from "lucide-react";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="w-full py-20 md:py-32 relative overflow-hidden"
    >
      <div className="container px-4 mx-auto md:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
        >
          <Badge
            className="rounded-full px-4 py-1.5 text-sm font-medium bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-[#3ECF8E] hover:bg-[#3ECF8E]/20"
            variant="secondary"
          >
            Pricing
          </Badge>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            style={{
              backgroundImage:
                "linear-gradient(rgb(245, 245, 245), rgb(245, 245, 245) 29%, rgb(153, 153, 153))",
              color: "transparent",
              fontFamily: "GeistSans, sans-serif",
              fontSize: "clamp(32px, 6vw, 52px)",
              fontWeight: 600,
              letterSpacing: "clamp(-1.5px, -0.04em, -2.08px)",
              lineHeight: "1.15",
              textAlign: "center",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            Simple, Transparent Pricing — Pay with Crypto
          </h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            Skip the paperwork. Pay once, verify forever. VeriBase accepts major
            cryptocurrencies for secure, borderless transactions.
          </p>
        </motion.div>

        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="eth" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="rounded-full p-1 bg-white/5 border border-white/10">
                <TabsTrigger
                  value="eth"
                  className="rounded-full px-6 data-[state=active]:bg-[#3ECF8E]/20 data-[state=active]:text-[#3ECF8E]"
                >
                  ETH
                </TabsTrigger>
                <TabsTrigger
                  value="usdc"
                  className="rounded-full px-6 data-[state=active]:bg-[#3ECF8E]/20 data-[state=active]:text-[#3ECF8E]"
                >
                  USDC
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="eth">
              <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                {[
                  {
                    name: "Basic Verification",
                    price: "0.005",
                    currency: "ETH",
                    description: "Verify 1 land title or 1 national ID",
                    features: [
                      "Blockchain record for ownership proof",
                      "Lifetime verification validity",
                      "Instant on-chain confirmation",
                      "Downloadable certificate",
                    ],
                    cta: "Pay with Crypto",
                  },
                  {
                    name: "Pro Verification",
                    price: "0.02",
                    currency: "ETH",
                    description: "Verify up to 5 documents",
                    features: [
                      "Priority validation queue",
                      "Real-time on-chain proof tracking",
                      "Lifetime verification validity",
                      "Email notifications",
                      "Bulk upload support",
                    ],
                    cta: "Pay with Crypto",
                    popular: true,
                  },
                  {
                    name: "Enterprise",
                    price: "Custom",
                    currency: "",
                    description: "Bulk or institutional verification",
                    features: [
                      "API access for businesses",
                      "Dedicated support and audit log",
                      "Custom smart contract integration",
                      "24/7 priority support",
                      "White-label options",
                      "Volume discounts",
                    ],
                    cta: "Contact for Quote",
                  },
                ].map((plan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card
                      className={`group relative overflow-hidden h-full transition-all duration-300 ${
                        plan.popular
                          ? "border-[#3ECF8E]/50 shadow-lg shadow-[#3ECF8E]/10 hover:shadow-xl hover:shadow-[#3ECF8E]/20"
                          : "border-border/40 shadow-md hover:border-[#3ECF8E]/30"
                      } bg-gradient-to-b from-background to-muted/10 backdrop-blur hover:scale-[1.02]`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#3ECF8E] to-emerald-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                          Most Popular
                        </div>
                      )}
                      {/* Subtle top gradient on hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3ECF8E] to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <CardContent className="p-6 flex flex-col h-full">
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline mt-4">
                          <span className="text-4xl font-bold text-[#3ECF8E]">
                            {plan.price}
                          </span>
                          {plan.currency && (
                            <span className="text-muted-foreground ml-2 font-mono">
                              {plan.currency}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                          {plan.description}
                        </p>
                        <ul className="space-y-3 my-6 flex-grow">
                          {plan.features.map((feature, j) => (
                            <li key={j} className="flex items-center text-sm">
                              <Check className="mr-2 size-4 text-[#3ECF8E] flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`group/btn w-full mt-auto rounded-full transition-all duration-300 ${
                            plan.popular
                              ? "bg-gradient-to-r from-[#3ECF8E] to-emerald-500 hover:from-[#3ECF8E]/90 hover:to-emerald-500/90 text-white hover:scale-105 hover:shadow-lg hover:shadow-[#3ECF8E]/30"
                              : "bg-white/5 hover:bg-white/10 border border-[#3ECF8E]/30 hover:border-[#3ECF8E]/50 hover:scale-105"
                          }`}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          {plan.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="usdc">
              <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                {[
                  {
                    name: "Basic Verification",
                    price: "10",
                    currency: "USDC",
                    description: "Verify 1 land title or 1 national ID",
                    features: [
                      "Blockchain record for ownership proof",
                      "Lifetime verification validity",
                      "Instant on-chain confirmation",
                      "Downloadable certificate",
                    ],
                    cta: "Pay with Crypto",
                  },
                  {
                    name: "Pro Verification",
                    price: "40",
                    currency: "USDC",
                    description: "Verify up to 5 documents",
                    features: [
                      "Priority validation queue",
                      "Real-time on-chain proof tracking",
                      "Lifetime verification validity",
                      "Email notifications",
                      "Bulk upload support",
                    ],
                    cta: "Pay with Crypto",
                    popular: true,
                  },
                  {
                    name: "Enterprise",
                    price: "Custom",
                    currency: "",
                    description: "Bulk or institutional verification",
                    features: [
                      "API access for businesses",
                      "Dedicated support and audit log",
                      "Custom smart contract integration",
                      "24/7 priority support",
                      "White-label options",
                      "Volume discounts",
                    ],
                    cta: "Contact for Quote",
                  },
                ].map((plan, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  >
                    <Card
                      className={`group relative overflow-hidden h-full transition-all duration-300 ${
                        plan.popular
                          ? "border-[#3ECF8E]/50 shadow-lg shadow-[#3ECF8E]/10 hover:shadow-xl hover:shadow-[#3ECF8E]/20"
                          : "border-border/40 shadow-md hover:border-[#3ECF8E]/30"
                      } bg-gradient-to-b from-background to-muted/10 backdrop-blur hover:scale-[1.02]`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#3ECF8E] to-emerald-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg">
                          Most Popular
                        </div>
                      )}
                      {/* Subtle top gradient on hover */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3ECF8E] to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <CardContent className="p-6 flex flex-col h-full">
                        <h3 className="text-2xl font-bold">{plan.name}</h3>
                        <div className="flex items-baseline mt-4">
                          <span className="text-4xl font-bold text-[#3ECF8E]">
                            {plan.price}
                          </span>
                          {plan.currency && (
                            <span className="text-muted-foreground ml-2 font-mono">
                              {plan.currency}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">
                          {plan.description}
                        </p>
                        <ul className="space-y-3 my-6 flex-grow">
                          {plan.features.map((feature, j) => (
                            <li key={j} className="flex items-center text-sm">
                              <Check className="mr-2 size-4 text-[#3ECF8E] flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          className={`group/btn w-full mt-auto rounded-full transition-all duration-300 ${
                            plan.popular
                              ? "bg-gradient-to-r from-[#3ECF8E] to-emerald-500 hover:from-[#3ECF8E]/90 hover:to-emerald-500/90 text-white hover:scale-105 hover:shadow-lg hover:shadow-[#3ECF8E]/30"
                              : "bg-white/5 hover:bg-white/10 border border-[#3ECF8E]/30 hover:border-[#3ECF8E]/50 hover:scale-105"
                          }`}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          {plan.cta}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Crypto Payment Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
              Crypto transactions are final and verified on-chain. No hidden
              fees.
            </p>

            {/* Supported Tokens */}
            <div className="flex items-center justify-center gap-6 mt-6 opacity-40 grayscale hover:opacity-60 transition-opacity duration-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-500" />
                <span className="text-xs font-mono text-muted-foreground">
                  ETH
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                <span className="text-xs font-mono text-muted-foreground">
                  USDC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                <span className="text-xs font-mono text-muted-foreground">
                  SOL
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
