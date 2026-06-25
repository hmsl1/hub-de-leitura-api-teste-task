/// <reference types="cypress" />
import { fakerPT_BR as faker } from '@faker-js/faker';

describe('Testes da Funcionalidade Catálogo de Livros', () => {

     let token
     beforeEach(() => {
          cy.geraToken('admin@biblioteca.com', 'admin123').then(tkn => {
               token = tkn
          })
     });

     // Objetivo: Verificar que a API retorna lista de livros com paginação e filtros funcionando
     // Validar que filtros por categoria e autores funcionam corretamente
     it('GET - Deve listar livros com filtros e paginação', () => {

          // Listagem básica
          cy.api({
               method: 'GET',
               url: '/books',
               qs: { page: 1, limit: 10 }
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body).to.have.property('books')
               expect(response.body.books).to.be.an('array')
               expect(response.body).to.have.property('pagination')
          })
          // Filtro por categoria
          cy.api({
               method: 'GET',
               url: '/books',
               qs: { category: 'Ficção' }
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.books[0].category).to.equal('Ficção')
          })
          // Filtro por autor
          cy.api({
               method: 'GET',
               url: '/books',
               qs: { author: 'J.K. Rowling' }
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.books).to.be.an('array')
          })
     })

     // Objetivo: Validar que é possível obter detalhes de um livro específico pelo ID
     // Verificar que todos os campos do livro são retornados corretamente
     it('GET - Deve obter detalhes de um livro específico', () => {
          cy.api({
               method: 'GET',
               url: '/books/1',
          }).should(response => {
               expect(response.status).to.equal(200)
               expect(response.body.book).to.have.property('id')
               expect(response.body.book).to.have.property('title')
               expect(response.body.book).to.have.property('author')
               expect(response.body.book).to.have.property('category')
          })
     });

     // Objetivo: Validar que um novo livro é adicionado com sucesso ao catálogo
     // Verificar que apenas admin pode adicionar novos livros (validação de permissão)
     it('POST - Deve cadastrar um novo livro com sucesso', () => {
          let title = faker.book.title()
          let author = faker.person.fullName()
          let category = faker.helpers.arrayElement(['Ficção', 'Não-Ficção', 'Romance', 'Fantasia', 'Biografia'])
          // Usuário admin cadastrando livro
          cy.api({
               method: 'POST',
               url: '/books',
               headers: { 'Authorization': token },
               body: {

                    "title": title,
                    "author": author,
                    "category": category,
                    "total_copies": 2
               }
          }).should(response => {
               expect(response.status).to.equal(201)
               expect(response.body.book).to.have.property('id')
               expect(response.body).to.have.property('book')
               expect(response.body.book.title).to.equal(title)
               expect(response.body.book.author).to.equal(author)
               expect(response.body.book.category).to.equal(category)
          })
          // Usuário comum cadastrando livro
          cy.api({
               method: 'POST',
               url: '/books',
               body: {

                    "title": title,
                    "author": author,
                    "category": category,
                    "total_copies": 2
               },
               failOnStatusCode: false
          }).should(response => {
               expect(response.status).to.equal(401)
          })
     })

     // Objetivo: Garantir que dados inválidos são rejeitados ao adicionar um livro
     // Validar mensagens de erro apropriadas para dados faltantes ou incorretos
     it('POST -  Deve rejeitar livro com dados inválidos', () => {
          cy.api({
               method: 'POST',
               url: '/books',
               headers: { 'Authorization': token },
               body: {
                    "title": "",
                    "author": "",
                    "category": "",
               },
               failOnStatusCode: false
          }).should(response => {
               expect(response.status).to.equal(400)
               expect(response.body.message).to.include('\"title\" is not allowed to be empty')
          })
     });

     // Objetivo: Validar que um livro pode ser atualizado com sucesso
     // Verificar que apenas admin pode atualizar livros (validação de permissão)
     it('PUT - Deve atualizar um livro previamente cadastrado', () => {
          let title = faker.book.title()
          let author = faker.person.fullName()
          let category = faker.helpers.arrayElement(['Ficção', 'Não-Ficção', 'Romance', 'Fantasia', 'Biografia'])

          // Usuário admin atualizando livro
          cy.cadastrarLivro(title, author, category, 2, token).then(bookId => {
               cy.api({
                    method: 'PUT',
                    url: 'books/' + bookId,
                    headers: { 'Authorization': token },
                    body: {
                         title: 'Teste',
                         author: 'Teste',
                         category: 'Teste',
                         total_copies: 5
                    }
               }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.message).to.equal('Livro atualizado com sucesso.')
               });

               // Usuário comum tentando atualizar livro sem autorização
               cy.api({
                    method: 'PUT',
                    url: 'books/' + bookId,
                    body: {
                         title: 'Teste',
                         author: 'Teste',
                         category: 'Teste',
                         total_copies: 5
                    },
                    failOnStatusCode: false
               }).should(response => {
                    expect(response.status).to.equal(401)
               })
          })
     });

     // Objetivo: Validar que um livro pode ser removido do catálogo
     // Verificar que apenas admin pode deletar livros (validação de permissão)
     it.skip('DELETE - Deve deletar um livro previamente cadastrado', () => {
               // Usuário comum tentando deletar livro sem autorização
               cy.api({
                    method: 'DELETE',
                    url: '/books/25',
                    failOnStatusCode: false
               }).should(response => {
                    expect(response.status).to.equal(401)
               })
               //Usuário admin atualizando livro
               cy.api({
                    method: 'DELETE',
                    url: '/books/25',
                    headers: { 'Authorization': token }
               }).should(response => {
                    expect(response.status).to.equal(200)
                    expect(response.body.message).to.equal('Livro deletado com sucesso.')
               })
          })
     })
