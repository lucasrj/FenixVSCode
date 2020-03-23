import * as vscode from 'vscode';

import FenixConfig from './configuration/FenixConfig';
import RepoHandler from './template/RepoHandler';
import ReposWebview from './webviews/ReposWebview';
import FenixParser from './FenixParser';
import NewProjectWebview from './webviews/NewProjectWebview';

export default class Fenix {
    private _webviewNewProject: NewProjectWebview;
    private _webviewRepos: ReposWebview;
    private _configuration: FenixConfig;
    private _repoHandler: RepoHandler;

    private _parser: FenixParser;

    constructor(extensionContext: vscode.ExtensionContext) {
        this._webviewNewProject = new NewProjectWebview(extensionContext, this.handleEvent.bind(this));
        this._webviewRepos = new ReposWebview(extensionContext, this.handleEvent.bind(this));
        this._configuration = new FenixConfig();
        this._repoHandler = new RepoHandler(this._configuration);

        this._parser = new FenixParser(extensionContext);
    }

    show() {
        this._repoHandler.getTemplates()
            .then(templates => {
                const languages = this._repoHandler.getLangs();
                const categories = this._repoHandler.getCategories();
                const env = this._configuration.getEnv();

                this._parser.clear();
                this._parser.push('languages', languages);
                this._parser.push('languages_count', languages.length);
                this._parser.push('categories', categories);
                this._parser.push('categories_count', categories.length);
                this._parser.push('templates', templates);
                for (let k in env) {
                    this._parser.push(k, env[k]);
                }

                this._webviewNewProject.show(this._parser);
            });
    }

    showRepos() {
        const env = this._configuration.getEnv();

        this._parser.clear();
        this._parser.push('repos', this._configuration.getRepos());
        for (let k in env) {
            this._parser.push(`env.${k}`, env[k]);
        }

        this._webviewRepos.show(this._parser);
    }

    handleEvent(event: { command: string, id: string }) {
        this._parser.clear();
        const env = this._configuration.getEnv();
        for (let k in env) {
            this._parser.push(`env.${k}`, env[k]);
        }

        switch (event.command) {
            case 'create':
                const rootPath = vscode.workspace.workspaceFolders
                    ? vscode.workspace.workspaceFolders[0].uri.fsPath
                    : '';
                this._repoHandler.runTemplate(event.id, rootPath, this._parser);
                break;
        }
    }
}