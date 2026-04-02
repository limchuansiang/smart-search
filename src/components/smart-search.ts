import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { SearchResult } from '../types';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

// Grouping search results
const groupBy = (array: any[], key: string) => {
	return array.reduce((result, currentValue) => {
		(result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
		return result;
	}, {});
};

@customElement('smart-search')

export class SmartSearch extends LitElement {

	// Defining properties
	@property({ type: String }) placeholder = 'Search...';
	@property({ type: Array }) data: SearchResult[] = [];
	@property({ type: String, reflect: true }) theme = 'light';

	// State internal variables
	@state() private _query = '';
	@state() private _isOpen = false;
	@state() private _activeIndex = -1;  // used for keyboard navigation

	// Defining styles
	static styles = css`
		:host {
			display: block;
			position: relative;
			--web-bg: #ffffff;		/* Default light theme colors */
			--web-text: #1a1a1a;
			--web-border: #d1d1d1;
			--web-accent: #003366;
			--web-hover: #f5f7f9;
			--web-muted: #666666;
		}
		:host([theme="dark"]) {
			--web-bg: #1a1a1a;			/* Dark theme overrides */
			--web-text: #ffffff;
			--web-border: #444444;
			--web-accent: #4d94ff;
			--web-hover: #2d2d2d;
			--web-muted: #aaaaaa;
		}
		.search-container {
			width: 100%;
			background: var(--web-bg);
			color: var(--web-text);
		}
		.search-input {
			width: 100%;
			padding: 10px 35px 10px 10px;
			box-sizing: border-box;
			border: 1px solid var(--web-border);
			border-radius: 4px;
			font-size: 1em;
			background: var(--web-bg);
			color: var(--web-text);
		}
		.search-input:focus {
			outline: none;
			border-color: var(--web-accent);
		}
		.results-list {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			background: var(--web-bg);
			color: var(--web-text);
			border: 1px solid var(--web-border);
			border-radius: 4px;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
			list-style: none;
			padding: 0;
			margin: 4px 0 0 0;
			max-height: 300px;
			overflow-y: auto;
			z-index: 100;
		}
		.category-header {
			padding: 8px 10px;
			background: var(--web-hover);
			font-size: 0.9em;
			font-weight: bold;
			text-transform: uppercase;
			color: var(--web-muted);
			letter-spacing: 0.05em;
		}
		.result-item {
			padding: 10px;
			cursor: pointer;
		}
		.result-item[aria-selected="true"] {
			background: var(--web-hover);
			border-left: 4px solid var(--web-accent);
		}
		.result-item:hover {
			background: var(--web-hover);
		}
		.result-title {
			display: block;
			font-weight: 500;
		}
		.result-desc {
			display: block;
			font-size: 0.85em;
			opacity: 0.7;
		}
		.sr-only {
			position: absolute;		/* For screen readers */
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			border: 0;
		}
		.input-wrapper {
			position: relative;
			display: flex;
			align-items: center;
		}
		.clear-button {
			position: absolute;
			right: 10px;
			background: none;
			border: none;
			color: var(--web-muted);
			cursor: pointer;
			font-size: 1.2em;
			line-height: 1;
			padding: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.clear-button:hover {
			color: var(--web-text);
		}
		mark {
			background: transparent;
			color: var(--web-accent);
			font-weight: 600;
			text-decoration: underline;
			padding: 0;
		}

	`;


	// Logic function - Search input handling
	private _handleInput(e: InputEvent) {
		this._query = (e.target as HTMLInputElement).value;
		this._isOpen = this._query.length > 0;
		this._activeIndex = -1;
	}

    // Logic function - Keyboard navigation
	private _handleKeyDown(e: KeyboardEvent) {
		const filteredResults = this.data.filter(item =>
			item.title.toLowerCase().includes(this._query.toLowerCase()) ||
			item.description?.toLowerCase().includes(this._query.toLowerCase()) ||
            item.category.toLowerCase().includes(this._query.toLowerCase())
		);
        const totalCount = filteredResults.length;

		if (e.key === 'ArrowDown') {
			this._activeIndex = Math.min(this._activeIndex + 1, totalCount - 1);
			e.preventDefault();
		} else if (e.key === 'ArrowUp') {
			this._activeIndex = Math.max(this._activeIndex - 1, 0);
			e.preventDefault();
		} else if (e.key === 'Escape') {
			this._isOpen = false;
		} else if (e.key === 'Enter' && this._activeIndex > -1) {
			this._selectItem(filteredResults[this._activeIndex]);
		} else if (e.key === 'Home') {
			this._activeIndex = 0;
		} else if (e.key === 'End') {
			this._activeIndex = totalCount - 1;
		}
	}

    // Logic function - Item selection
	private _selectItem(item: SearchResult) {
		this._query = item.title;
		this._isOpen = false;
		this.dispatchEvent(new CustomEvent('item-selected', {
			detail: item,
			bubbles: true,		// Allows event to bubble up through the DOM
            composed: true		// Allows event to cross shadow DOM boundaries
		}));
	}

	// Logic function - Closes result dropdown if user clicks outside
	private _handleDocumentClick = (e: MouseEvent) => {
		if (!this.contains(e.target as Node)) {
			this._isOpen = false;
		}
	}
	connectedCallback() {
		super.connectedCallback();
		document.addEventListener('click', this._handleDocumentClick);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		document.removeEventListener('click', this._handleDocumentClick);
	}

	// Logic function - Clears the search input
	private _clearSearch() {
		this._query = '';
		this._isOpen = false;
		this._activeIndex = -1;
		const input = this.shadowRoot?.querySelector('input');		// Focus back on input after clearing
		input?.focus();
	}

	// Logic function - Highlights matching query + sanitizes input to prevent XSS
	private _highlight(text: string) {
		if (!this._query.trim()) return text;

		// Escape special characters in query to prevent script injection
		const div = document.createElement('div');
		div.textContent = text;
		const escapedText = div.innerHTML;

		const regex = new RegExp(`(${this._query})`, 'gi');		// Global, case-insensitive
		const highlighted = escapedText.replace(regex, `<mark>$1</mark>`);

        return html`${unsafeHTML(highlighted)}`;
	}


	// Rendering component
	render() {
		const filteredResults = this.data.filter(item =>
			item.title.toLowerCase().includes(this._query.toLowerCase()) ||
			item.description?.toLowerCase().includes(this._query.toLowerCase()) ||
            item.category.toLowerCase().includes(this._query.toLowerCase())
		);

        const groups = groupBy(filteredResults, 'category');

		return html`
			<div class="search-container">
				<div class="input-wrapper">
					<input
						class="search-input"
						type="text"
						placeholder="${this.placeholder}"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded="${this._isOpen}"
						aria-controls="results-list"
						aria-haspopup="listbox"
						.value="${this._query}"
						@input="${this._handleInput}"
						@keydown="${this._handleKeyDown}"
					/>
					${this._query ? html`
						<button
							class="clear-button"
							@click="${this._clearSearch}"
							aria-label="Clear search inputs"
							type="button">&times;
						</button>
					` : ''}
				</div>

				${this._isOpen && filteredResults.length > 0 ? html`
					<ul id="results-list" class="results-list" role="listbox">
						${Object.keys(groups).map(category => html`
							<li class="category-header" role="presentation">${category}</li>

							${groups[category].map((item: SearchResult) => html`
								<li 
									class="result-item"
									role="option"
									aria-selected="${item === filteredResults[this._activeIndex]}"
									@click="${() => this._selectItem(item)}">
									<span class="result-title">${this._highlight(item.title)}</span>
									${item.description ? html`<span class="result-desc">${this._highlight(item.description)}</span>` : ''}
								</li>
							`)}
						`)}
					</ul>
				` : ''}

				<div class="sr-only" aria-live="polite">
					${this._query ? `${filteredResults.length} results found.` : ''}
				</div>
			</div>
		`;
	}
}
