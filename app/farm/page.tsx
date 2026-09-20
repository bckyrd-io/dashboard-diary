"use client";
import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import useUserStore from "../store/zustand";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useToast } from "../../hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
    username: z.string().min(1, { message: "Username is required." }),
    password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const setUser = useUserStore((state) => state.setUser);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        try {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) {
                toast({ variant: "default", title: "Failed to login", description: result.message });
                return;
            }

            setUser(result.user);
            toast({
                variant: "default",
                title: `Welcome, ${result.user.username}!`,
                description: "You have successfully logged in.",
            });
            router.push(result.user.role === "admin" ? "/store/dashboard" : "/store/items");
        } catch (err) {
            console.error("Error logging in:", err);
            toast({
                variant: "default",
                title: "Unexpected Error",
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-[90vh] p-4">
            <Card className="shadow-none w-full max-w-sm p-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter your username"
                                            {...field}
                                            className="border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-500 mt-1" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                {...field}
                                                className="border rounded-md p-2 w-full pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            />
                                            <button
                                                type="button"
                                                className="absolute top-1/2 right-3 transform -translate-y-1/2"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-600" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500 mt-1" />
                                </FormItem>
                            )}
                        />
                        <Button variant="default" type="submit" disabled={loading} className="w-full">
                            {loading ? "Loading ..." : "Login"}
                        </Button>
                        <div className="flex justify-left ">
                            <Link href="/" className="flex  text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <ArrowLeft className="h-5 w-4 mr-1" />
                                Back to Home
                            </Link>
                        </div>
                    </form>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;