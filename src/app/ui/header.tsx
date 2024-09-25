"use client";
import { useRef, useState } from "react";
import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faBug, faXmark } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import Popup from "./popup";
import Field from "./field";
import TextBox from "./textbox";
import Button from "./button";

export default function Header() {
    let [historyIsVisible, setHistoryVisibility] = useState(false);
    let [history, setHistory] = useState<React.JSX.Element[]>([]);

    let [bugReportingFormIsVisible, setBugReportingFormVisibility] = useState(false);
    let [reportBugButton, setReportBugButton] = useState<React.JSX.Element>(<Button text="Submit Report" classes={["w-full", "mt-3"]} click={submitBugReport} />);    

    let bugTitleField = useRef<HTMLInputElement>(null);
    let bugDescriptionField = useRef<HTMLTextAreaElement>(null);

    function openHistory() {
        setBugReportingFormVisibility(false);
        setHistoryVisibility(true);
        
        getHistory();
    }
    
    function closeHistory() {
        setHistoryVisibility(false);
    }

    function formatBytes(bytes: number): string {
        switch (true) {
            case (bytes < 1024):
                return `${bytes} B`;
            case (bytes < 1024 * 1024):
                return `${(bytes / 1024).toFixed(2)} kB`;
            case (bytes < 1024 * 1024 * 1024):
                return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            default:
                return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    }

    async function getHistory() {
        let list: React.JSX.Element[] = [];
        
        try {
            let response = await fetch("/api/history");
            let records: any[] = await response.json();

            if (!records.length) {
                list.push(<div className="py-4 text-center font-medium text-sm text-slate-400 text-opacity-60 select-none">You don't have any upload history.</div>);
            }

            for (let record of records) {
                list.push(<div className="px-1.5 py-1 mt-1 rounded-md bg-slate-200 bg-opacity-50">
                    <Link href={`/uploads/${record.id}`} target="_blank" className="text-slate-500 font-bold decoration-2 hover:underline">{record.id}</Link>
                    <div className="text-sm font-medium text-slate-400">{new Date(record.id).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })} &middot; {record.files} Files &middot; {formatBytes(record.size)}</div>
                </div>);
            }
        } catch (ex: any) {
            console.error(ex);
            list.push(<div className="py-4 text-center font-medium text-sm text-red-500 select-none">Unable to retrieve upload history.</div>);
        }

        setHistory(list);
    }

    function openBugReportingForm() {
        setHistoryVisibility(false);
        setBugReportingFormVisibility(true);
    }

    function closeBugReportingForm() {
        setBugReportingFormVisibility(false);
    }

    async function submitBugReport() {
        if (!bugTitleField?.current || !bugDescriptionField?.current) return;

        setReportBugButton(<Button text="Submitting..." classes={["w-full", "mt-3", "pointer-events-none", "opacity-50"]} />);

        try {
            let response = await fetch("/api/report", {
                method: "POST",
                body: new URLSearchParams({ title: bugTitleField.current.value ?? "", description: bugDescriptionField.current.textContent ?? "" })
            });

            let result = await response.json();

            if (result.success) {
                setReportBugButton(<strong className="mt-2 text-emerald-400 font-medium">Report submitted. You can now close this window.</strong>);
            }
        } catch {
            setReportBugButton(<strong className="mt-2 text-red-500 font-medium">Unable to submit report. Please try again later.</strong>);
        }
    }

    let historyPopup = historyIsVisible ? <Popup title="Upload History" close={closeHistory} content={history} /> : "";

    let bugReportingPopup = bugReportingFormIsVisible ? <Popup title="Report An Issue" close={closeBugReportingForm} content={<div className="mt-2">
        <label className="block mt-3 mb-1.5 text-xs font-bold">TITLE</label>
        <Field classes={["w-full"]} type="text" innerRef={bugTitleField} />
        <label className="block mt-3 mb-1.5 text-xs font-bold">DESCRIPTION</label>
        <TextBox classes={["w-full resize-none"]} rows="5" innerRef={bugDescriptionField} />
        {reportBugButton}
    </div>} /> : "";

    return (
        <>
            <header className="absolute top-0 left-0 right-0">
                <Banner content={<span>&#127881; Share 3.0.0 is here. Check out whats changed by clicking <a href="https://github.com/harveycoombs/share/releases" target="_blank" className="hover:underline">here</a>.</span>} />
                <div className="flex justify-between items-center p-4 max-[460px]:p-3">
                    <strong className="text-sm font-bold max-lg:text-xs">MADE <span className="max-[460px]:hidden">WITH <span className="text-slate-800 dark:text-slate-700">REACT</span></span> BY <a href="https://harveycoombs.com/" target="_blank" className="text-slate-800 decoration-2 hover:underline dark:text-slate-700">HARVEY COOMBS</a></strong>
                    <div className="text-sm font-bold pointer-events-none select-none max-lg:hidden">UPLOADS OLDER THAN 30 DAYS ARE DELETED &middot; 5GB MAXIMUM UPLOAD SIZE</div>
                    <nav>
                        <HeaderNavigationItem title="View Upload History" icon={faClockRotateLeft} click={openHistory} />
                        <HeaderNavigationItem title="Report an Issue" icon={faBug}  click={openBugReportingForm} />
                        <HeaderNavigationItem url="https://github.com/harveycoombs/share" title="View on GitHub" icon={faGithub} />
                    </nav>
                </div>
            </header>
            {historyPopup}
            {bugReportingPopup}
        </>
    );
}

function HeaderNavigationItem(props: any) {
    let classes = "inline-block align-middle text-xl ml-5 duration-150 cursor-pointer hover:text-slate-400 active:text-slate-500 max-[460px]:ml-4 max-[460px]:text-lg";

    return (
        props.url?.length ? <Link href={props.url} target="_blank" className={classes} title={props.title} draggable="false"><FontAwesomeIcon icon={props.icon} /></Link> : <div className={classes} title={props.title} draggable="false" onClick={props.click}><FontAwesomeIcon icon={props.icon} /></div>
    );
}

function Banner(props: any) {
    let banner = useRef<HTMLDivElement>(null);

    function closeBanner() {
        if (!banner?.current) return;
        banner.current.remove();
    }

    return (
        <div className="relative p-1.5 text-sm font-medium text-center bg-blue-100 text-blue-600 max-lg:text-xs" ref={banner}>{props.content}<div className="absolute right-3 top-0 translate-y-px text-lg cursor-pointer hover:text-blue-400" onClick={closeBanner}><FontAwesomeIcon icon={faXmark} /></div></div>
    );
}