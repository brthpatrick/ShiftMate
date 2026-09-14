using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShiftMate.API.Migrations
{
    /// <inheritdoc />
    public partial class RefactorEmployeePreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PreferredDay",
                table: "EmployeePreferences");

            migrationBuilder.DropColumn(
                name: "UnavailableDay",
                table: "EmployeePreferences");

            migrationBuilder.CreateTable(
                name: "EmployeeDayPreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    IsPreferred = table.Column<bool>(type: "bit", nullable: false),
                    IsUnavailable = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeDayPreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeDayPreferences_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeDayPreferences_EmployeeId_DayOfWeek",
                table: "EmployeeDayPreferences",
                columns: new[] { "EmployeeId", "DayOfWeek" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmployeeDayPreferences");

            migrationBuilder.AddColumn<int>(
                name: "PreferredDay",
                table: "EmployeePreferences",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UnavailableDay",
                table: "EmployeePreferences",
                type: "int",
                nullable: true);
        }
    }
}
