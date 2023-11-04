import { useEffect, useState } from "react";
import { Body, getClient } from "@tauri-apps/api/http";
import { Loader } from "./components/atoms/Loader";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { GPT350TURBO16k } from "./utils/GPT_Models";

import clsx from "clsx";
import { Link } from "react-router-dom";
import { countTokens } from "./utils/countTokens";
import React from "react";

type InitialTokenType = {
	data: {
		code: number;
		msg: string;
		token: string;
	};
};

type InitialObjectType = InitialTokenType & {
	isLoading: boolean;
};
type TaskSchemaType = {
	data: {
		code: number;
		cookie: string;
		msg: string;
	};
};

type TaskObjectType = TaskSchemaType & {
	isLoading: boolean;
};

type ChatWithAiSchemaType = {
	role: "user" | "assistant";
	content: string;
};

function App() {
	const [initiaObject, setInitialObject] = useState<InitialObjectType>({
		data: { code: 0, msg: "", token: "" },
		isLoading: false,
	});
	const [TaskObject, setTaskObject] = useState<TaskObjectType>({
		data: { code: 0, cookie: "", msg: "" },
		isLoading: false,
	});
	const [taskName, setTaskName] = useState("");
	const [userPrompt, setUserPrompt] = useState("");
	const [streamResponse, setStreamResponse] = useState("");
	const [streamLoading, setStreamLoading] = useState(false);
	const [streamHistory, setStreamHistory] = useState<ChatWithAiSchemaType[]>([]);
	const [visibility, setVisibility] = useState({
		showHistory: true,
		showResponse: false,
	});
	const containerRef = React.useRef<HTMLFormElement>(null);

	useEffect(() => {
		scrollDown();
	}, [streamHistory]);

	async function getInitialToken(): Promise<InitialTokenType> {
		const client = await getClient();
		setInitialObject({
			data: { ...initiaObject.data },
			isLoading: true,
		});
		try {
			const response: InitialTokenType = await client.request({
				method: "POST",
				url: `${import.meta.env.VITE_GET_INITIAL_TOKEN_URL}/${taskName}`,
				body: Body.json({ apikey: import.meta.env.VITE_TASKS_API_KEY }),
			});

			setInitialObject({
				isLoading: false,
				data: response.data,
			});

			return response;
		} catch (e) {
			setInitialObject({
				isLoading: false,
				data: { code: 0, msg: "Error", token: "Error" },
			});
			return { data: { code: 0, msg: "Error", token: "Error" } };
		}
	}

	async function getTaskSchema<T>(taskToken: string): Promise<T> {
		const client = await getClient();
		setTaskObject({
			data: { ...TaskObject.data },
			isLoading: true,
		});

		try {
			const response = (await client.request({
				method: "GET",
				url: `${import.meta.env.VITE_GET_TASK_URL}/${taskToken}`,
			})) as T;

			const { data } = response as TaskObjectType;
			console.log("data", data);
			setTaskObject({
				isLoading: false,
				data,
			});
			return response as T;
		} catch (e) {
			return { data: { code: 0, cookie: "Error", msg: "Error" } } as T;
		}
	}

	async function handleTask(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const {
			data: { token },
		} = await getInitialToken();
		const response: TaskSchemaType = await getTaskSchema<TaskObjectType>(token);
		console.log(response);
		// setTaskSchema(response.data);
	}

	const scrollDown = () => {
		if (containerRef.current) {
			containerRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	};

	const systemTemplate =
		"Answer the following question use CONTEXT as the to follow previus answer and questions. If there is no CONTEXT yet answer regulary. Each response have to be returned as makrdown. So if your response has list elements, code block etc use makrdown syntax.";

	const chat = new ChatOpenAI({
		openAIApiKey: import.meta.env.VITE_MY_API_KEY,
		modelName: GPT350TURBO16k,
		streaming: true,
	});

	const StartChatWithAi = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setStreamLoading(true);
		setVisibility({ showHistory: false, showResponse: true });

		const MessageWithorWithoutContext =
			streamHistory.length > 0
				? `$here is CONTEXT of our conversation: ${JSON.stringify(streamHistory, null, 2)} 
          and here is new message: ${userPrompt}`
				: userPrompt;

		const stream = await chat.stream([
			new HumanMessage(
				// `Here is context of our conversation: ${JSON.stringify(
				// 	streamHistory,
				// )}, and here is user prompt: ${userPrompt}`,
				MessageWithorWithoutContext,
			),
			new SystemMessage(systemTemplate),
		]);

		let assistantResponse = "";
		for await (const res of stream) {
			console.log(res.content);
			assistantResponse += res.content;

			setStreamResponse((prev) => prev + res.content);
		}
		setVisibility({ showHistory: true, showResponse: false });
		setStreamLoading(false);

		setStreamHistory((prev) => [
			...prev,
			{ role: "user", content: userPrompt },
			{ role: "assistant", content: assistantResponse },
		]);
		setStreamResponse("");
		if (containerRef.current) {
			containerRef.current?.scrollIntoView({ behavior: "smooth" });
		}
		const testTokens = countTokens(JSON.stringify(streamHistory), 2042);
		console.log("testTokens", testTokens);

		// const num = encoding.encode(JSON.stringify(streamHistory)).length;
		// console.log("encoding", num);
		// const num = countTokens([JSON.stringify(streamHistory]), 'gpt-4'); // 11
	};

	return (
		<>
			<main className="flex min-h-screen flex-col items-center bg-slate-900 pt-5">
				<img className="w-48" src="./logo.png" alt="ai devs logo" />

				<Link to="/ask-ai">Ask GPT</Link>

				<form className="flex flex-col gap-3" onSubmit={handleTask}>
					<label className="mt-3 flex flex-col gap-2" htmlFor="taskName">
						<span className="text-green-500">Task name</span>{" "}
						<input
							className="min-h-10 w-full rounded-lg bg-slate-600 px-5 py-2 text-white"
							type="text"
							value={taskName}
							onChange={(e) => setTaskName(e.target.value)}
							name="taskName"
						/>
					</label>
					<button
						type="submit"
						className="mx-auto my-5 rounded-lg border-2 border-solid border-white px-5 py-2 text-white"
					>
						Run Task
					</button>
				</form>
				{initiaObject?.data.token && (
					<article className="flex w-full flex-col items-start gap-3 px-10 py-2">
						<span className="text-green-500">
							<strong>Server response: </strong>
						</span>
						<Loader loading={initiaObject.isLoading} />

						<SyntaxHighlighter
							customStyle={{ width: "100%", padding: "2rem", borderRadius: "10px" }}
							language="json"
							style={atomOneDark}
						>
							{initiaObject && JSON.stringify(initiaObject.data, null, 2)}
						</SyntaxHighlighter>
					</article>
				)}

				{TaskObject.data.msg !== "" && (
					<article className="flex w-full flex-col items-start gap-3 overflow-hidden px-10 py-2">
						<span className="text-green-500">
							<strong>Server response: </strong>
						</span>
						<Loader loading={TaskObject?.isLoading} />

						<SyntaxHighlighter
							customStyle={{ width: "100%", padding: "2rem", borderRadius: "10px" }}
							language="json"
							style={atomOneDark}
						>
							{JSON.stringify(TaskObject.data, null, 2)}
						</SyntaxHighlighter>
					</article>
				)}

				<button onClick={scrollDown}>scroll</button>

				<h2 className="text-white">Ai part</h2>

				{streamLoading && <Loader loading={streamLoading} />}
				{visibility.showHistory &&
					streamHistory.map((item, index) => (
						<div
							key={index + item.content.slice(0, 10)}
							className={clsx(
								`prose relative my-5 flex w-2/3 max-w-3xl flex-col flex-wrap rounded-lg bg-gray-700 px-6 py-6 text-white ${
									item.role === "user" && "bg-green-800"
								}`,
							)}
						>
							<img
								className="absolute left-2 top-2 my-0 h-12 w-12"
								src={`${item.role === "assistant" ? "/boticon.png" : "usericon.png"}`}
							/>
							<SyntaxHighlighter
								customStyle={{
									width: "100%",
									marginTop: "0",
									maxWidth: "800px",
									padding: "2rem",
									borderRadius: "10px",
								}}
								language="json"
								wrapLines={true}
								wrapLongLines={true}
								style={atomOneDark}
							>
								{item.content}
							</SyntaxHighlighter>
						</div>
					))}
				{visibility.showResponse && (
					<div className="prose relative my-5 flex w-2/3 max-w-3xl flex-wrap  rounded-lg bg-gray-700 px-6 py-6 text-white">
						<img className="absolute left-2 top-2 my-0 h-12 w-12" src={"/boticon.png"} />
						<SyntaxHighlighter
							customStyle={{
								width: "100%",
								maxWidth: "800px",
								marginTop: "0",
								padding: "2rem",
								borderRadius: "10px",
							}}
							wrapLines={true}
							language="json"
							style={atomOneDark}
							wrapLongLines={true}
						>
							{streamResponse}
						</SyntaxHighlighter>
					</div>
				)}
				<form ref={containerRef} onSubmit={StartChatWithAi}>
					<label className="mt-3 flex flex-col gap-2" htmlFor="userPrompt">
						<input
							onChange={(e) => setUserPrompt(e.target.value)}
							className=" w-full rounded-lg bg-slate-600 px-5 py-2 text-white"
							value={userPrompt}
							name="userPrompt"
							type="text"
						/>
					</label>

					<button type="submit" className="border-2 border-solid border-white text-white">
						run ai
					</button>
				</form>
			</main>
		</>
	);
}

export default App;
